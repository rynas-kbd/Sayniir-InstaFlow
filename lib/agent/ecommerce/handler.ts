import { createAdminClient } from '../../supabase/admin.ts'
import { callAgentLLM } from '../engine.ts'
import { sendAndReport, type AgentChannel } from '../messaging.ts'
import { fenceUserText } from '../history.ts'
import { checkConfidenceEscalation } from '../confidence.ts'
import { renderCardAsText } from '../../channels/shared/card-text.ts'
import { computeOrderTotals } from '../../boutique/order-total.ts'
import type { AgentOutcome } from '../types.ts'
import { getTemplate } from './templates.ts'
import {
  flushCompletedLine,
  getMissingFields,
  getNextQuestion,
  isCancellationMessage,
  isConfirmationMessage,
  normalizeAlgerianPhone,
  normalizeDeliveryMode,
  type Product,
} from './state.ts'
import { selectRelevantProducts, toPromptCatalogEntry } from './search.ts'
import { parseSlot, resolveProduct } from './parse.ts'
import { detectLanguage, type DetectedLang } from './lang.ts'
import { classifyIntent, isGreeting } from './intent.ts'
import { detectShopIntent } from './intent-router.ts'
import { resolveAvailability } from './availability.ts'

/**
 * E-commerce order-taking + Q&A agent — ported verbatim from the live
 * supabase/functions/_shared/meta/ecommerce.ts (Deno). This is the real
 * production behavior (algorithmic slot-filling, multilingual templates,
 * quick replies), not the simpler lib/meta/ecommerce.ts it replaces.
 */

interface ExtractedFields {
  items?: Array<{
    product_id?: string | null
    selected_size?: string | null
    selected_color?: string | null
    quantity?: number | string | null
  }>
  product_id?: string | null
  selected_size?: string | null
  selected_color?: string | null
  quantity?: number | string | null
  customer_name?: string | null
  customer_phone?: string | null
  wilaya?: string | null
  delivery_mode?: string | null
  shipping_address?: string | null
  extra_data?: Record<string, string>
}

interface EcommerceLlmResult {
  extractedData: ExtractedFields
  isQuestion: boolean
  questionReply: string | null
  /** Only meaningful when isQuestion is true — see lib/agent/confidence.ts. */
  confidence?: number
  detectedLanguage: string
}

interface CartItem {
  product_id: string
  product_name: string
  selected_size: string | null
  selected_color: string | null
  quantity: number
}

interface ResolvedOrderLine {
  product_id: string
  variant_id: string | null
  product_name: string
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  currency: string
  kind: string
}

function normalizeQuantity(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeCartItems(value: unknown, products: Product[]): CartItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const raw = item as Record<string, unknown>
      const productId = typeof raw.product_id === 'string' ? raw.product_id : null
      const product = products.find((p) => p.id === productId)
      const quantity = normalizeQuantity(raw.quantity)
      if (!productId || !product || !quantity) return null
      return {
        product_id: productId,
        product_name: typeof raw.product_name === 'string' && raw.product_name.trim() ? raw.product_name : product.name,
        selected_size: typeof raw.selected_size === 'string' ? raw.selected_size : null,
        selected_color: typeof raw.selected_color === 'string' ? raw.selected_color : null,
        quantity,
      }
    })
    .filter((item): item is CartItem => Boolean(item))
}

function buildRecapLines(args: {
  lines: ResolvedOrderLine[]
  totals: { subtotal: number; discount: number; total: number }
  t: ReturnType<typeof getTemplate>
}): string[] {
  const { lines, totals, t } = args
  const currency = lines[0]?.currency ?? 'DZD'
  return [
    `• ${t.labelItems} :`,
    ...lines.map((line, index) => {
      const variant = [line.size ? `${t.labelSize}: ${line.size}` : null, line.color ? `${t.labelColor}: ${line.color}` : null]
        .filter(Boolean)
        .join(', ')
      const suffix = variant ? ` (${variant})` : ''
      return `  ${index + 1}. ${line.product_name}${suffix} — ${line.quantity} × ${line.unit_price} ${line.currency} = ${line.quantity * line.unit_price} ${line.currency}`
    }),
    `• ${t.labelSubtotal} : ${totals.subtotal} ${currency}`,
    ...(totals.discount > 0 ? [`• ${t.labelDiscount} : -${totals.discount} ${currency}`] : []),
    `• ${t.labelTotal} : ${totals.total} ${currency}`,
  ]
}

async function releaseReservedStock(
  supabase: ReturnType<typeof createAdminClient>,
  reservations: Array<{ productId: string; variantId: string | null; quantity: number }>
) {
  for (const reserved of reservations.reverse()) {
    if (reserved.variantId) {
      await supabase.rpc('increment_variant_stock', { p_variant_id: reserved.variantId, p_quantity: reserved.quantity })
    } else {
      await supabase.rpc('increment_product_stock', { p_product_id: reserved.productId, p_quantity: reserved.quantity })
    }
  }
}

async function resolveOrderLines(
  supabase: ReturnType<typeof createAdminClient>,
  items: CartItem[],
  products: Product[]
): Promise<ResolvedOrderLine[]> {
  const lines: ResolvedOrderLine[] = []
  for (const item of items) {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) continue

    let unitPrice = product.price
    let variantId: string | null = null
    if (item.selected_size || item.selected_color) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, price_override, stock_quantity')
        .eq('product_id', item.product_id)
        .eq('size', item.selected_size ?? null)
        .eq('color', item.selected_color ?? null)
        .maybeSingle()
      if (variant) {
        variantId = variant.id
        if (variant.price_override !== null) unitPrice = variant.price_override
      }
    }

    lines.push({
      product_id: item.product_id,
      variant_id: variantId,
      product_name: product.name,
      size: item.selected_size ?? null,
      color: item.selected_color ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
      currency: product.currency ?? 'DZD',
      kind: product.kind ?? 'physical',
    })
  }
  return lines
}

export async function handleQaMessage({
  accountId,
  senderId,
  channel,
  messageText,
  products,
  customInstructions = [],
  faqs = [],
  persona,
  history = '',
  isOrderTakingActive = false,
  skipReplyOnPurchaseIntent = false,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  /** Only needed for confidence-based escalation (lib/agent/confidence.ts) — this handler otherwise has no DB access. */
  accountId: string
  senderId: string
  channel: AgentChannel
  messageText: string
  products: Product[]
  customInstructions?: string[]
  faqs?: Array<{ question: string; answer: string }>
  persona?: string
  /** Pre-rendered block from lib/agent/history.ts::renderHistoryBlock, or '' for none. */
  history?: string
  isOrderTakingActive?: boolean
  skipReplyOnPurchaseIntent?: boolean
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<{ hasPurchaseIntent: boolean; productNameHint: string | null; outcome: AgentOutcome }> {
  const route = 'ecommerce.qa'
  const { products: qaRelevantProducts, wasFiltered: qaCatalogFiltered } = selectRelevantProducts(products, messageText)
  const productList = qaRelevantProducts
    .map((p) => {
      const extras = [
        `${p.price} DA`,
        ...(p.sizes?.length ? [`tailles: ${p.sizes.join('/')}`] : []),
        ...(p.colors?.length ? [`couleurs: ${p.colors.join('/')}`] : []),
      ].join(' — ')
      return `• ${p.name} (${extras})`
    })
    .join('\n')
  const qaCatalogNote = qaCatalogFiltered
    ? `\n(Catalogue complet plus large — si le client cherche autre chose, propose de vérifier plutôt que d'inventer.)\n`
    : ''

  const orderHint = isOrderTakingActive
    ? `Si le client veut commander (ex: "je veux commander", "comment commander", "je veux le [produit] en [taille/couleur]"), mets hasPurchaseIntent = true. Si un produit du catalogue est identifiable dans le message, mets son nom exact dans "productNameHint" (sinon null) — cela évite un second appel pour re-détecter ce que le client a déjà dit.`
    : `hasPurchaseIntent doit toujours être false, et productNameHint toujours null.`

  const faqBlock = faqs.length
    ? `=== BASE DE CONNAISSANCES (réponds en priorité à partir de ces Q&R) ===\n${faqs.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join('\n\n')}\n`
    : ''

  const personaBlock = persona
    ? `=== TON RÔLE & PERSONNALITÉ ===\n${persona}\n`
    : 'Tu es un assistant e-commerce pour une boutique Instagram algérienne.\nTu réponds aux questions des clients sur le catalogue, les prix, les tailles, la livraison.\n'

  const prompt = `
${personaBlock}
Tu ne prends pas de commandes.

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}
${faqBlock}
=== CATALOGUE ===
${productList || 'Aucun produit actif.'}${qaCatalogNote}
${history}
=== MESSAGE ===
"${fenceUserText(messageText)}"

=== TÂCHES ===
1. Détecte la langue : "fr", "ar", "darija", ou "en".
2. Si la question est couverte par la base de connaissances, utilise-la en priorité.
3. Réponds de manière chaleureuse et précise dans la langue du client.
4. ${orderHint}
5. Évalue ta propre confiance dans "confidence" (0 à 1) : basse (< 0.5) si la question sort du cadre de la boutique, si l'information demandée n'est couverte ni par le catalogue ni par la base de connaissances, ou si le message est trop ambigu pour y répondre avec certitude.

JSON uniquement (sans backticks) :
{
  "reply": "ta réponse",
  "detectedLanguage": "fr | ar | darija | en",
  "hasPurchaseIntent": true | false,
  "productNameHint": "nom exact du produit ou null",
  "confidence": 0.0
}`

  let llm: {
    reply: string
    detectedLanguage: string
    hasPurchaseIntent: boolean
    productNameHint?: string | null
    confidence?: number
  }
  try {
    llm = await callAgentLLM(prompt, aiProvider, aiApiKey, aiModel)
  } catch (err) {
    console.error('[QA] LLM error:', err)
    // No customer-facing "problème technique" — the Q&A agent has nothing
    // to re-ask (unlike the order-taking tunnel). Reporting this as an
    // 'error' outcome (rather than silently claiming success) lets the
    // dispatch layer fall back to a keyword rule or the default message
    // instead of the customer getting nothing while the dashboard shows
    // "handled" (audit finding F3).
    return { hasPurchaseIntent: false, productNameHint: null, outcome: { status: 'error', error: err, route } }
  }

  if (skipReplyOnPurchaseIntent && llm.hasPurchaseIntent) {
    return {
      hasPurchaseIntent: true,
      // Lets the tunnel resolve the product deterministically (see
      // resolveProduct in parse.ts) instead of always spending a second LLM
      // call re-extracting what this call already saw (audit finding F9).
      productNameHint: llm.productNameHint || null,
      outcome: { status: 'no_reply', reason: 'purchase intent handed off to the order-taking tunnel', route },
    }
  }

  const handoffLang = detectLanguage(messageText, 'fr')
  const escalation = await checkConfidenceEscalation(accountId, senderId, channel, llm.confidence, route, getTemplate(handoffLang).humanHandoff)
  if (escalation) return { hasPurchaseIntent: false, productNameHint: null, outcome: escalation }

  const outcome = await sendAndReport(channel, llm.reply, route, undefined, llm.confidence)
  return { hasPurchaseIntent: llm.hasPurchaseIntent ?? false, productNameHint: null, outcome }
}

export async function handleEcommerceMessage({
  accountId,
  senderId,
  messageText,
  channel,
  customInstructions = [],
  infosToCollect = [],
  faqs = [],
  persona,
  history = '',
  prefillProductId = null,
  isAvailabilityActive = false,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string
  senderId: string
  messageText: string
  channel: AgentChannel
  customInstructions?: string[]
  infosToCollect?: string[]
  faqs?: Array<{ question: string; answer: string }>
  persona?: string
  /** Pre-rendered block from lib/agent/history.ts::renderHistoryBlock, or '' for none. */
  history?: string
  /**
   * Product id already resolved deterministically by the caller (see
   * inbound.ts resolving handleQaMessage's productNameHint via
   * resolveProduct) — only applied on a brand-new session, where it lets
   * this turn skip the LLM extraction call entirely instead of spending a
   * second call re-detecting what the Q&A call already saw (audit finding
   * F9).
   */
  prefillProductId?: string | null
  /** Mirrors agent_settings.is_availability_check_active — gates the in-tunnel availability guard below (see intent === 'question'). */
  isAvailabilityActive?: boolean
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<AgentOutcome> {
  const route = 'ecommerce.tunnel'
  const BUILTIN_KEYWORDS = [
    'produit',
    'taille',
    'couleur',
    'nom',
    'téléphone',
    'telephone',
    'numéro',
    'numero',
    'wilaya',
    'livraison',
    'quartier',
    'cité',
    'adresse',
  ]
  const customInfos = infosToCollect.filter((info) => !BUILTIN_KEYWORDS.some((kw) => info.toLowerCase().includes(kw)))

  const supabase = createAdminClient()

  // Deliberately NOT filtered by stock here (unlike the catalog shown in
  // Q&A, see inbound.ts) — this array also resolves the customer's
  // ALREADY-selected product for an in-progress session, which must keep
  // working even if that product sells out mid-conversation. The actual
  // no-overselling guarantee is the atomic re-check right before the order
  // is inserted below (audit finding F10), not this list.
  const { data: products } = await supabase.from('products').select('*').eq('channel_account_id', accountId).eq('is_active', true)

  let { data: session } = await supabase
    .from('order_sessions')
    .select('*')
    .eq('channel_account_id', accountId)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  let isNewSession = false

  if (!session) {
    isNewSession = true
    const { data: newSession, error } = await supabase
      .from('order_sessions')
      .insert({
        channel_account_id: accountId,
        sender_id: senderId,
        status: 'selecting_product',
        product_id: null,
        selected_size: null,
        selected_color: null,
        quantity: null,
        items: [],
        add_more: null,
        shipping_address: null,
        wilaya: null,
        delivery_mode: null,
        customer_name: null,
        customer_phone: null,
        extra_data: {},
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('order_sessions')
        .select('*')
        .eq('channel_account_id', accountId)
        .eq('sender_id', senderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!existing) {
        return sendAndReport(channel, 'Désolé, problème technique. Réessayez dans quelques instants.', route)
      }

      const { data: resetSession, error: resetError } = await supabase
        .from('order_sessions')
        .update({
          status: 'selecting_product',
          product_id: null,
          selected_size: null,
          selected_color: null,
          quantity: null,
          items: [],
          add_more: null,
          shipping_address: null,
          wilaya: null,
          delivery_mode: null,
          customer_name: null,
          customer_phone: null,
          extra_data: {},
          // Previously left out of the reset — a customer whose first-ever
          // session got its language mis-detected stayed locked into it
          // across every future order. awaiting_field also resets so the
          // deterministic parser doesn't try to resolve a stale slot.
          detected_language: null,
          awaiting_field: null,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (resetError || !resetSession) {
        return sendAndReport(channel, 'Désolé, problème technique. Réessayez dans quelques instants.', route)
      }
      session = resetSession
    } else if (error) {
      console.error('[Ecommerce] Session creation failed:', error)
      return sendAndReport(channel, 'Désolé, problème technique. Réessayez dans quelques instants.', route)
    } else {
      session = newSession
    }
  }

  // Language: detected fresh every turn (script/keyword based, no LLM call —
  // see lang.ts). The session's last known language is only a fallback for
  // ambiguous short replies ("M", "oui"), never a permanent freeze — the
  // previous design locked in whatever the FIRST message detected and reused
  // it for every template for the rest of the session, while the LLM's own
  // prose kept following the CURRENT message's language, producing replies
  // that were half Arabic, half French.
  const persistedLang = (session.detected_language as DetectedLang | null) ?? 'fr'
  const lang = detectLanguage(messageText, persistedLang)
  const t = getTemplate(lang)

  const awaitingField = (session.awaiting_field as string | null) ?? null
  const currentProduct = (products ?? []).find((p) => p.id === session.product_id) ?? null
  const persistedQuantity =
    normalizeQuantity((session as { quantity?: unknown }).quantity) ??
    (session.product_id && awaitingField && !['produit', 'taille', 'couleur', 'quantité'].includes(awaitingField) ? 1 : null)

  const updated = {
    ...session,
    items: normalizeCartItems((session as { items?: unknown }).items, products ?? []),
    quantity: persistedQuantity,
    add_more: ((session as { add_more?: string | null }).add_more === 'pending' || (session as { add_more?: string | null }).add_more === 'done'
      ? (session as { add_more?: 'pending' | 'done' }).add_more
      : null),
  }
  let isConfirmation = false
  let isCancellation = false
  let deterministicallyResolved = false

  // ── Cross-cutting intents, recognized from ANY point in the flow ───────
  // Previously the tunnel understood exactly one alternative to "answer the
  // field being asked": a bare yes/no at the final confirmation step. A
  // greeting sent mid-checkout was intercepted upstream and cancelled the
  // whole session outright — the only "exit" the tunnel had (audit finding
  // F6). See lib/agent/ecommerce/intent.ts.
  const intent = classifyIntent(messageText, awaitingField)

  // ── In-tunnel availability guard (requirement §6, applied mid-checkout) ──
  // A question arriving mid-flow ("il est encore dispo ?") would otherwise
  // go straight to the LLM extraction prompt below, which has no hard stock
  // signal and can only guess — the exact thing this feature exists to
  // prevent. Only short-circuits a genuine 'question' (never a slot
  // answer), and only when the stock check actually resolves to a real
  // product — anything else (ambiguous/not found/lookup failed) falls
  // through to the LLM as before, since a wrong guess here is worse than
  // the LLM's own "let me check" phrasing.
  if (isAvailabilityActive && intent === 'question') {
    const routedInTunnel = detectShopIntent(messageText, { hasSharedPost: false })
    if (routedInTunnel.primary === 'availability') {
      const candidateProducts = currentProduct ? [currentProduct] : products ?? []
      const resolution = await resolveAvailability({ supabase, accountId, messageText, products: candidateProducts })
      if (resolution.kind === 'available' || resolution.kind === 'out_of_stock') {
        const availabilityLine =
          resolution.kind === 'available'
            ? t.availableYes(resolution.product.name, resolution.product.price, resolution.product.currency ?? 'DZD')
            : t.availableNo(resolution.product.name)
        const nextQuestion = getNextQuestion(awaitingField ?? 'produit', updated, products ?? [], t, false)
        return sendAndReport(channel, `${availabilityLine}\n\n${nextQuestion.text}`, route, nextQuestion.quickReplies)
      }
    }
  }

  if (intent === 'human') {
    await supabase
      .from('contacts')
      .update({ bot_paused: true, bot_paused_at: new Date().toISOString() })
      .eq('channel_account_id', accountId)
      .eq('sender_id', senderId)
    return sendAndReport(channel, t.humanHandoff, route)
  }

  if (isGreeting(messageText) && awaitingField && !isNewSession) {
    const nextQuestion = getNextQuestion(awaitingField, updated, products ?? [], t, false)
    return sendAndReport(channel, `${t.welcome}\n\n${nextQuestion.text}`, route, nextQuestion.quickReplies)
  }

  // ── Deterministic-first slot resolution ────────────────────────────────
  // The machine always knows the ONE field it just asked for. Resolving
  // that field with plain matching (catalog lookup, regex, wilaya table)
  // before ever calling the LLM removes the LLM round-trip from the vast
  // majority of turns — and removes the failure modes that came with
  // extracting from free text on every message: a mid-flow question like
  // "vous livrez le vendredi ?" being silently stored as the shipping
  // address because it was ≥10 characters, or "non" to a delivery-mode
  // question being read as "cancel the order" by a confirmation regex that
  // ran unconditionally regardless of what was actually asked.
  if (intent === 'cancel') {
    isCancellation = true
    deterministicallyResolved = true
  } else if (intent === 'restart') {
    updated.product_id = null
    updated.selected_size = null
    updated.selected_color = null
    updated.quantity = null
    updated.items = []
    updated.add_more = null
    updated.customer_name = null
    updated.customer_phone = null
    updated.wilaya = null
    updated.delivery_mode = null
    updated.shipping_address = null
    updated.extra_data = {}
    deterministicallyResolved = true
  } else if (intent === 'change_product' && updated.product_id) {
    updated.product_id = null
    updated.selected_size = null
    updated.selected_color = null
    updated.quantity = null
    updated.add_more = null
    deterministicallyResolved = true
  } else if (isNewSession && prefillProductId) {
    // The Q&A call that handed this turn off to the tunnel (audit finding
    // F9) already resolved a product name deterministically via
    // resolveProduct — no need to spend this turn's LLM call re-detecting
    // it from scratch.
    updated.product_id = prefillProductId
    deterministicallyResolved = true
  } else if (awaitingField === 'produit') {
    const resolved = resolveProduct(messageText, products ?? [])
    if (resolved) {
      updated.product_id = resolved.id
      deterministicallyResolved = true
    }
  } else if (awaitingField) {
    const slotResult = parseSlot(awaitingField, messageText, currentProduct)
    if (slotResult.matched) {
      deterministicallyResolved = true
      if (awaitingField === 'confirmation') {
        isConfirmation = !!slotResult.isConfirmation
        isCancellation = !!slotResult.isCancellation
      } else if (awaitingField === 'taille') {
        updated.selected_size = slotResult.value ?? null
      } else if (awaitingField === 'couleur') {
        updated.selected_color = slotResult.value ?? null
      } else if (awaitingField === 'quantité') {
        updated.quantity = normalizeQuantity(slotResult.value)
      } else if (awaitingField === 'autre article') {
        updated.add_more = slotResult.isAddMoreYes ? null : 'done'
      } else if (awaitingField === 'wilaya') {
        updated.wilaya = slotResult.value ?? null
      } else if (awaitingField === 'mode de livraison') {
        updated.delivery_mode = slotResult.value ?? null
      } else if (awaitingField === 'téléphone') {
        updated.customer_phone = slotResult.value ?? null
      } else if (awaitingField === 'nom complet') {
        updated.customer_name = slotResult.value ?? null
      } else if (awaitingField === 'adresse complète') {
        updated.shipping_address = slotResult.value ?? null
      } else {
        updated.extra_data = { ...(updated.extra_data ?? {}), [awaitingField.toLowerCase().trim()]: slotResult.value ?? '' }
      }
    }
  }

  let llmResult: EcommerceLlmResult | null = null

  if (!deterministicallyResolved) {
    // Confirmation/cancellation intent is only ever read from the message
    // when the recap was actually the last thing shown — never as a bare
    // unconditional regex over any message (that's what let "non" to a
    // delivery-mode question cancel an in-progress order).
    if (awaitingField === 'confirmation') {
      isConfirmation = isConfirmationMessage(messageText)
      isCancellation = isCancellationMessage(messageText)
    }

    const extraDataKeys = customInfos.map((i) => i.toLowerCase().trim())
    const sessionContext = isNewSession
      ? "C'est le PREMIER message du client. Si c'est une salutation, note-le dans isQuestion."
      : `La session est EN COURS. Champ actuellement attendu : "${awaitingField ?? 'aucun'}". État actuel :\n${JSON.stringify(
          {
            items: updated.items,
            add_more: updated.add_more,
            product_id: session.product_id,
            selected_size: session.selected_size,
            selected_color: session.selected_color,
            quantity: session.quantity,
            customer_name: session.customer_name,
            customer_phone: session.customer_phone,
            wilaya: session.wilaya,
            delivery_mode: session.delivery_mode,
            shipping_address: session.shipping_address,
            extra_data: session.extra_data,
          },
          null,
          2
        )}`

    const personaBlock = persona ? `=== TON RÔLE & PERSONNALITÉ ===\n${persona}\n` : "Tu es l'agent de vente d'une boutique e-commerce algérienne.\n"
    const faqBlock = faqs.length
      ? `=== BASE DE CONNAISSANCES (utilise-la si le client pose une question pendant la commande) ===\n${faqs.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join('\n\n')}\n`
      : ''

    const { products: orderRelevantProducts, wasFiltered: orderCatalogFiltered } = selectRelevantProducts(products ?? [], messageText, {
      mustInclude: session.product_id,
    })
    const orderCatalogNote = orderCatalogFiltered
      ? '\n(Catalogue complet plus large — si le produit voulu ne figure pas ci-dessus, mets product_id à null plutôt que de deviner.)\n'
      : ''

    const prompt = `
${personaBlock}

=== CONTEXTE SESSION ===
${sessionContext}

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}
${faqBlock}
=== CATALOGUE ===
${JSON.stringify(orderRelevantProducts.map(toPromptCatalogEntry), null, 2)}${orderCatalogNote}
${history}
=== MESSAGE CLIENT ===
"${fenceUserText(messageText)}"

=== TES TÂCHES ===
1. Extrais toutes les données de commande présentes dans le message.
2. Détermine isQuestion :
   - true UNIQUEMENT si : (a) salutation sur nouvelle session, (b) vraie question sur produits/prix/tailles/livraison
   - false si : le client donne une info de commande (nom, téléphone, adresse, taille, couleur, wilaya, etc.)
   - RÈGLE : session en cours + message interprétable comme donnée → isQuestion = false
3. Si isQuestion = true → questionReply = réponse en langue "${lang}", et évalue ta confiance dans "confidence" (0 à 1 ; basse si l'information n'est ni dans le catalogue ni dans les instructions/base de connaissances, ou si la question sort du cadre de la boutique). Sinon questionReply et confidence restent null.

=== RÈGLES D'EXTRACTION ===
- Téléphone algérien : 07/06/05xxxxxxxx ou +213xxxxxxxxx
- delivery_mode : "domicile" ou "point_retrait" (ou null si non mentionné)
- quantity : entier positif ; si non mentionné, laisse null.
- items : remplis uniquement si le message nomme clairement au moins 2 produits distincts du catalogue. Si un produit est ambigu ou absent du catalogue, laisse items vide/null plutôt que de deviner.
- extra_data clés attendues : ${extraDataKeys.length ? extraDataKeys.map((k) => `"${k}"`).join(', ') : 'aucune'}

JSON uniquement (sans backticks) :
{
  "extractedData": {
    "items": [{ "product_id": "UUID", "selected_size": "taille ou null", "selected_color": "couleur ou null", "quantity": 1 }],
    "product_id": "UUID ou null",
    "selected_size": "taille ou null",
    "selected_color": "couleur ou null",
    "quantity": 1,
    "wilaya": "wilaya ou null",
    "delivery_mode": "domicile | point_retrait | null",
    "shipping_address": "adresse ou null",
    "customer_name": "nom ou null",
    "customer_phone": "téléphone ou null",
    "extra_data": { ${extraDataKeys.map((k) => `"${k}": "valeur ou null"`).join(', ')} }
  },
  "isQuestion": true | false,
  "questionReply": "réponse ou null",
  "confidence": 0.0
}`

    try {
      llmResult = await callAgentLLM<EcommerceLlmResult>(prompt, aiProvider, aiApiKey, aiModel)
    } catch (err) {
      // No more generic "problème technique" dead-end: re-ask whatever the
      // machine was already waiting for. A repeated question is
      // recoverable for the customer; an error message mid-purchase is not.
      console.error('[Ecommerce] LLM error:', err)
      const missingOnError = getMissingFields(updated, products ?? [], customInfos)
      const fallbackField = missingOnError[0] ?? awaitingField ?? 'produit'
      const fallbackQuestion = getNextQuestion(fallbackField, updated, products ?? [], t, isNewSession)
      await supabase
        .from('order_sessions')
        .update({ awaiting_field: fallbackField, detected_language: lang, last_message_at: new Date().toISOString() })
        .eq('id', session.id)
      return sendAndReport(channel, fallbackQuestion.text, route, fallbackQuestion.quickReplies)
    }

    const extracted: ExtractedFields = llmResult.extractedData ?? {}
    extracted.delivery_mode = normalizeDeliveryMode(extracted.delivery_mode, messageText)
    if (extracted.customer_phone) extracted.customer_phone = normalizeAlgerianPhone(extracted.customer_phone)

    const mergedExtra: Record<string, string> = { ...(updated.extra_data ?? {}) }
    if (extracted.extra_data && typeof extracted.extra_data === 'object') {
      for (const [key, val] of Object.entries(extracted.extra_data)) {
        if (val && val !== 'null') mergedExtra[key.toLowerCase().trim()] = val as string
      }
    }

    const extractedItems = Array.isArray(extracted.items) ? extracted.items : []
    if (extractedItems.length >= 2) {
      const resolvedItems = extractedItems
        .map((item) => {
          const product = products?.find((p) => p.id === item.product_id)
          const quantity = normalizeQuantity(item.quantity) ?? 1
          if (!product) return null
          return {
            product_id: product.id,
            product_name: product.name,
            selected_size: item.selected_size ?? null,
            selected_color: item.selected_color ?? null,
            quantity,
          }
        })
        .filter((item): item is CartItem => Boolean(item))

      if (resolvedItems.length === extractedItems.length && new Set(resolvedItems.map((item) => item.product_id)).size >= 2) {
        const complete: CartItem[] = []
        let firstIncomplete: CartItem | null = null
        for (const item of resolvedItems) {
          const product = products?.find((p) => p.id === item.product_id)
          const needsSize = (product?.kind ?? 'physical') === 'physical' && !!product?.sizes?.length && !item.selected_size
          const needsColor = (product?.kind ?? 'physical') === 'physical' && !!product?.colors?.length && !item.selected_color
          if (!firstIncomplete && (needsSize || needsColor || !item.quantity)) firstIncomplete = item
          else if (!needsSize && !needsColor && item.quantity) complete.push(item)
        }
        updated.items = [...(updated.items ?? []), ...complete]
        updated.add_more = 'pending'
        if (firstIncomplete) {
          updated.product_id = firstIncomplete.product_id
          updated.selected_size = firstIncomplete.selected_size ?? null
          updated.selected_color = firstIncomplete.selected_color ?? null
          updated.quantity = firstIncomplete.quantity ?? null
        }
      }
    }

    if (extracted.product_id) updated.product_id = extracted.product_id
    if (extracted.selected_size) updated.selected_size = extracted.selected_size
    if (extracted.selected_color) updated.selected_color = extracted.selected_color
    if (extracted.quantity) updated.quantity = normalizeQuantity(extracted.quantity)
    if (extracted.wilaya) updated.wilaya = extracted.wilaya
    if (extracted.delivery_mode) updated.delivery_mode = extracted.delivery_mode
    if (extracted.shipping_address) updated.shipping_address = extracted.shipping_address
    if (extracted.customer_name) updated.customer_name = extracted.customer_name
    if (extracted.customer_phone) updated.customer_phone = extracted.customer_phone
    updated.extra_data = mergedExtra
  }

  // Only a genuine LLM-answered question carries real uncertainty — the
  // slot-extraction half of this same call is either right or wrong, not a
  // matter of "confidence" (and is deterministic-first anyway, see parseSlot).
  if (llmResult?.isQuestion && llmResult.questionReply) {
    const escalation = await checkConfidenceEscalation(accountId, senderId, channel, llmResult.confidence, route, t.humanHandoff)
    if (escalation) return escalation
  }

  if (!awaitingField || awaitingField === 'quantité') {
    Object.assign(updated, flushCompletedLine(updated, products ?? []))
  }
  if (awaitingField === 'confirmation' && (updated.items?.length ?? 0) > 0 && updated.add_more === 'pending') {
    updated.add_more = 'done'
  }

  const missing = getMissingFields(updated, products ?? [], customInfos)
  const allDone = missing.length === 0

  // Product just got selected this turn (not merely re-confirmed on every message) → show its photo once.
  const newlySelectedProduct =
    updated.product_id && updated.product_id !== session.product_id ? (products ?? []).find((p) => p.id === updated.product_id) : null

  let replyText: string
  let newStatus: string
  let newAwaitingField: string | null
  let quickReplies: Array<{ title: string; payload: string }> | undefined

  if (isCancellation) {
    replyText = t.cancelled
    newStatus = 'cancelled'
    newAwaitingField = null
  } else if (isConfirmation && allDone) {
    replyText = t.confirmed
    newStatus = 'confirmed'
    newAwaitingField = null
  } else if (allDone) {
    const resolvedLines = await resolveOrderLines(supabase, updated.items ?? [], products ?? [])
    const totals = computeOrderTotals(resolvedLines.map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })))
    const hasPhysicalKind = resolvedLines.some((line) => (line.kind ?? 'physical') === 'physical')
    const deliveryLabel = updated.delivery_mode === 'point_retrait' ? t.deliveryRelay : t.deliveryHome
    const extraLines = Object.entries(updated.extra_data ?? {})
      .map(([k, v]) => `• ${k} : ${v}`)
      .join('\n')

    replyText = [
      t.recap,
      '',
      ...buildRecapLines({ lines: resolvedLines, totals, t }),
      `• ${t.labelName} : ${updated.customer_name}`,
      `• ${t.labelPhone} : ${updated.customer_phone}`,
      // Non-physical kinds (service/digital/subscription/event) never
      // collect wilaya/delivery/address — showing them here always
      // rendered as literal "null" for those shops.
      hasPhysicalKind ? `• ${t.labelWilaya} : ${updated.wilaya}` : null,
      hasPhysicalKind ? `• ${t.labelDelivery} : ${deliveryLabel}` : null,
      hasPhysicalKind ? `• ${t.labelAddress} : ${updated.shipping_address}` : null,
      extraLines || null,
      '',
      t.recapConfirm,
    ]
      .filter((l) => l !== null)
      .join('\n')
    newStatus = 'gathering_info'
    newAwaitingField = 'confirmation'

    quickReplies = [
      { title: lang === 'fr' ? 'Oui' : lang === 'en' ? 'Yes' : lang === 'darija' ? 'واه' : 'نعم', payload: 'oui' },
      { title: lang === 'fr' ? 'Non' : lang === 'en' ? 'No' : 'لا', payload: 'non' },
    ]
  } else {
    newStatus = 'gathering_info'
    newAwaitingField = missing[0] ?? null
    const nextQuestion = getNextQuestion(missing[0], updated, products ?? [], t, isNewSession)
    quickReplies = nextQuestion.quickReplies

    if (llmResult?.isQuestion && llmResult.questionReply) {
      replyText = `${llmResult.questionReply}\n\n${nextQuestion.text}`
    } else {
      replyText = nextQuestion.text
    }
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    detected_language: lang,
    awaiting_field: newAwaitingField,
    last_message_at: new Date().toISOString(),
    product_id: updated.product_id ?? null,
    selected_size: updated.selected_size ?? null,
    selected_color: updated.selected_color ?? null,
    quantity: updated.quantity ?? null,
    items: updated.items ?? [],
    add_more: updated.add_more ?? null,
    wilaya: updated.wilaya ?? null,
    delivery_mode: updated.delivery_mode ?? null,
    shipping_address: updated.shipping_address ?? null,
    customer_name: updated.customer_name ?? null,
    customer_phone: updated.customer_phone ?? null,
    extra_data: updated.extra_data ?? {},
  }

  await supabase.from('order_sessions').update(updates).eq('id', session.id)

  if (newStatus === 'confirmed') {
    const { data: finalSession } = await supabase.from('order_sessions').select('*').eq('id', session.id).single()

    if (finalSession) {
      const finalItems = normalizeCartItems(finalSession.items, products ?? [])
      if (finalItems.length === 0 && finalSession.product_id) {
        const product = (products ?? []).find((p) => p.id === finalSession.product_id)
        if (product) {
          finalItems.push({
            product_id: product.id,
            product_name: product.name,
            selected_size: finalSession.selected_size ?? null,
            selected_color: finalSession.selected_color ?? null,
            quantity: normalizeQuantity(finalSession.quantity) ?? 1,
          })
        }
      }
      const resolvedLines = await resolveOrderLines(supabase, finalItems, products ?? [])
      const reservations: Array<{ productId: string; variantId: string | null; quantity: number }> = []

      const { data: linkedContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('channel_account_id', finalSession.channel_account_id)
        .eq('sender_id', finalSession.sender_id)
        .maybeSingle()

      let failedLine: ResolvedOrderLine | null = null
      for (const line of resolvedLines) {
        if ((line.kind ?? 'physical') !== 'physical') continue
        const rpcName = line.variant_id ? 'decrement_variant_stock' : 'decrement_product_stock'
        const rpcArgs = line.variant_id
          ? { p_variant_id: line.variant_id, p_quantity: line.quantity }
          : { p_product_id: line.product_id, p_quantity: line.quantity }
        const { data: ok, error } = await supabase.rpc(rpcName, rpcArgs)
        if (error) {
          console.error('[Ecommerce] Stock check failed:', error)
          reservations.push({ productId: line.product_id, variantId: line.variant_id, quantity: line.quantity })
          continue
        }
        if (!ok) {
          failedLine = line
          break
        }
        reservations.push({ productId: line.product_id, variantId: line.variant_id, quantity: line.quantity })
      }

      if (failedLine) {
        await releaseReservedStock(supabase, reservations)
        const remainingItems = finalItems.filter((item) => item.product_id !== failedLine?.product_id)
        const remainingLines = await resolveOrderLines(supabase, remainingItems, products ?? [])
        if (remainingItems.length === 0) {
          replyText = `${t.outOfStockLine(failedLine.product_name)}\n\n${t.cartEmptyAfterStockFailure}`
          await supabase
            .from('order_sessions')
            .update({ status: 'gathering_info', awaiting_field: 'produit', items: [], add_more: null, product_id: null, selected_size: null, selected_color: null, quantity: null })
            .eq('id', finalSession.id)
        } else {
          const totals = computeOrderTotals(remainingLines.map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })))
          replyText = [t.outOfStockLine(failedLine.product_name), '', ...buildRecapLines({ lines: remainingLines, totals, t }), '', t.recapConfirm].join('\n')
          await supabase
            .from('order_sessions')
            .update({ status: 'gathering_info', awaiting_field: 'confirmation', items: remainingItems, add_more: 'done' })
            .eq('id', finalSession.id)
        }
      } else {
        const PROMO_KEYS = ['promo_code', 'code_promo', 'code promo', 'coupon', 'code de réduction', 'code réduction']
        const rawPromoCode = PROMO_KEYS.map((k) => finalSession.extra_data?.[k]).find(Boolean)
        let appliedCode: string | null = null
        let discountPercentOff: number | null = null
        let discountAmountOff: number | null = null
        if (rawPromoCode) {
          const { data: redeemed } = await supabase.rpc('redeem_discount_code', {
            p_channel_account_id: finalSession.channel_account_id,
            p_code: String(rawPromoCode).trim().toUpperCase(),
          })
          if (redeemed) {
            appliedCode = redeemed.code
            discountPercentOff = redeemed.percent_off ?? null
            discountAmountOff = redeemed.amount_off ?? null
          }
        }

        const totals = computeOrderTotals(
          resolvedLines.map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })),
          { percent_off: discountPercentOff, amount_off: discountAmountOff }
        )
        const firstLine = resolvedLines[0]
        const hasPhysical = resolvedLines.some((line) => (line.kind ?? 'physical') === 'physical')
        const orderPayload = {
          channel_account_id: finalSession.channel_account_id,
          order_session_id: finalSession.id,
          contact_id: linkedContact?.id ?? null,
          customer_name: finalSession.customer_name ?? 'Inconnu',
          customer_phone: finalSession.customer_phone ?? 'Inconnu',
          wilaya: hasPhysical ? (finalSession.wilaya ?? 'Inconnue') : finalSession.wilaya ?? null,
          delivery_mode: hasPhysical ? (finalSession.delivery_mode ?? 'Inconnu') : finalSession.delivery_mode ?? null,
          shipping_address: hasPhysical ? (finalSession.shipping_address ?? '') : finalSession.shipping_address ?? null,
          product_name: firstLine?.product_name ?? 'Commande',
          currency: firstLine?.currency ?? 'DZD',
          price: firstLine?.unit_price ?? 0,
          size: firstLine?.size ?? null,
          color: firstLine?.color ?? null,
          quantity: firstLine?.quantity ?? 1,
          total_amount: totals.total,
          discount_percent_off: discountPercentOff,
          discount_amount_off: discountAmountOff,
          extra_data: { ...(finalSession.extra_data ?? {}), ...(appliedCode ? { applied_discount_code: appliedCode } : {}) },
        }
        const itemPayload = resolvedLines.map((line, index) => ({
          product_id: line.product_id,
          variant_id: line.variant_id,
          product_name: line.product_name,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
          unit_price: line.unit_price,
          currency: line.currency,
          position: index,
        }))

        const { data: orderId, error: insertError } = await supabase.rpc('create_order_with_items', {
          p_order: orderPayload,
          p_items: itemPayload,
        })

        if (insertError || !orderId) {
          console.error('[Ecommerce] Order creation failed:', insertError)
          await releaseReservedStock(supabase, reservations)
          replyText = t.recapConfirm
          await supabase.from('order_sessions').update({ status: 'gathering_info', awaiting_field: 'confirmation' }).eq('id', finalSession.id)
        } else {
          console.log(`[Ecommerce] Order created for session ${finalSession.id}`)
          await supabase.from('order_sessions').update({ status: 'confirmed' }).eq('id', finalSession.id)
        }
      }
    }
  }

  if (newlySelectedProduct?.image_url) {
    // Best-effort — this is a bonus, `replyText` below is the actual answer
    // this turn is judged on. Sent as a plain text link (not a card
    // attachment) so it actually reaches the customer on every channel —
    // see lib/channels/shared/card-text.ts.
    const photoText = renderCardAsText({
      title: newlySelectedProduct.name,
      subtitle: `${newlySelectedProduct.price} ${newlySelectedProduct.currency ?? 'DA'}`,
      imageUrl: newlySelectedProduct.image_url,
    })
    await channel.sendText(photoText).catch(() => null)
  }
  return sendAndReport(channel, replyText, route, quickReplies, llmResult?.isQuestion ? llmResult.confidence : undefined)
}
