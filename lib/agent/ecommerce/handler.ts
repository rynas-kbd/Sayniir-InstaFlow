import { createAdminClient } from '../../supabase/admin'
import { sendReply, sendCardReply, TokenExpiredError } from '../../meta/messaging'
import { callAgentLLM } from '../engine'
import { getTemplate } from './templates'
import {
  getMissingFields,
  getNextQuestion,
  isCancellationMessage,
  isConfirmationMessage,
  normalizeAlgerianPhone,
  normalizeDeliveryMode,
  type Product,
} from './state'
import { selectRelevantProducts, toPromptCatalogEntry } from './search'
import { transcribeVoiceForEcommerce } from './voice'
import { parseSlot, resolveProduct } from './parse'
import { detectLanguage, type DetectedLang } from './lang'

/**
 * E-commerce order-taking + Q&A agent — ported verbatim from the live
 * supabase/functions/_shared/meta/ecommerce.ts (Deno). This is the real
 * production behavior (algorithmic slot-filling, multilingual templates,
 * quick replies), not the simpler lib/meta/ecommerce.ts it replaces.
 */

interface ExtractedFields {
  product_id?: string | null
  selected_size?: string | null
  selected_color?: string | null
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
  detectedLanguage: string
}

export async function handleQaMessage({
  pageId,
  senderId,
  messageText,
  accessToken,
  products,
  customInstructions = [],
  faqs = [],
  persona,
  isOrderTakingActive = false,
  skipReplyOnPurchaseIntent = false,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  pageId: string
  senderId: string
  messageText: string
  accessToken: string
  products: Product[]
  customInstructions?: string[]
  faqs?: Array<{ question: string; answer: string }>
  persona?: string
  isOrderTakingActive?: boolean
  skipReplyOnPurchaseIntent?: boolean
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<{ hasPurchaseIntent: boolean }> {
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
    ? `Si le client veut commander (ex: "je veux commander", "comment commander"), mets hasPurchaseIntent = true.`
    : `hasPurchaseIntent doit toujours être false.`

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
=== MESSAGE ===
"${messageText}"

=== TÂCHES ===
1. Détecte la langue : "fr", "ar", "darija", ou "en".
2. Si la question est couverte par la base de connaissances, utilise-la en priorité.
3. Réponds de manière chaleureuse et précise dans la langue du client.
4. ${orderHint}

JSON uniquement (sans backticks) :
{
  "reply": "ta réponse",
  "detectedLanguage": "fr | ar | darija | en",
  "hasPurchaseIntent": true | false
}`

  try {
    const llm = await callAgentLLM<{ reply: string; detectedLanguage: string; hasPurchaseIntent: boolean }>(
      prompt,
      aiProvider,
      aiApiKey,
      aiModel
    )
    if (!(skipReplyOnPurchaseIntent && llm.hasPurchaseIntent)) {
      await sendReply(pageId, accessToken, senderId, llm.reply)
    }
    return { hasPurchaseIntent: llm.hasPurchaseIntent ?? false }
  } catch (err) {
    console.error('[QA] LLM error:', err)
    // No customer-facing "problème technique" — the Q&A agent has nothing
    // to re-ask (unlike the order-taking tunnel), so silence here is safer
    // than a foreign-language error dump: staying quiet lets a keyword rule
    // or the default message answer instead on a later fallback pass,
    // rather than guaranteeing an ugly reply on every transient 429/timeout.
    return { hasPurchaseIntent: false }
  }
}

export async function handleEcommerceMessage({
  accountId,
  pageId,
  senderId,
  messageText,
  accessToken,
  customInstructions = [],
  infosToCollect = [],
  faqs = [],
  persona,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string
  pageId: string
  senderId: string
  messageText: string
  accessToken: string
  customInstructions?: string[]
  infosToCollect?: string[]
  faqs?: Array<{ question: string; answer: string }>
  persona?: string
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<void> {
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

  const { data: products } = await supabase.from('products').select('*').eq('channel_account_id', accountId).eq('is_active', true)

  let { data: session } = await supabase
    .from('order_sessions')
    .select('*')
    .eq('channel_account_id', accountId)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .single()

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
        await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
        return
      }

      const { data: resetSession, error: resetError } = await supabase
        .from('order_sessions')
        .update({
          status: 'selecting_product',
          product_id: null,
          selected_size: null,
          selected_color: null,
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
        await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
        return
      }
      session = resetSession
    } else if (error) {
      console.error('[Ecommerce] Session creation failed:', error)
      await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
      return
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

  const updated = { ...session }
  let isConfirmation = false
  let isCancellation = false
  let deterministicallyResolved = false

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
  if (awaitingField === 'produit') {
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
            product_id: session.product_id,
            selected_size: session.selected_size,
            selected_color: session.selected_color,
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

=== MESSAGE CLIENT ===
"${messageText}"

=== TES TÂCHES ===
1. Extrais toutes les données de commande présentes dans le message.
2. Détermine isQuestion :
   - true UNIQUEMENT si : (a) salutation sur nouvelle session, (b) vraie question sur produits/prix/tailles/livraison
   - false si : le client donne une info de commande (nom, téléphone, adresse, taille, couleur, wilaya, etc.)
   - RÈGLE : session en cours + message interprétable comme donnée → isQuestion = false
3. Si isQuestion = true → questionReply = réponse en langue "${lang}". Sinon null.

=== RÈGLES D'EXTRACTION ===
- Téléphone algérien : 07/06/05xxxxxxxx ou +213xxxxxxxxx
- delivery_mode : "domicile" ou "point_retrait" (ou null si non mentionné)
- extra_data clés attendues : ${extraDataKeys.length ? extraDataKeys.map((k) => `"${k}"`).join(', ') : 'aucune'}

JSON uniquement (sans backticks) :
{
  "extractedData": {
    "product_id": "UUID ou null",
    "selected_size": "taille ou null",
    "selected_color": "couleur ou null",
    "wilaya": "wilaya ou null",
    "delivery_mode": "domicile | point_retrait | null",
    "shipping_address": "adresse ou null",
    "customer_name": "nom ou null",
    "customer_phone": "téléphone ou null",
    "extra_data": { ${extraDataKeys.map((k) => `"${k}": "valeur ou null"`).join(', ')} }
  },
  "isQuestion": true | false,
  "questionReply": "réponse ou null"
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
      await sendReply(pageId, accessToken, senderId, fallbackQuestion.text, fallbackQuestion.quickReplies)
      return
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

    if (extracted.product_id) updated.product_id = extracted.product_id
    if (extracted.selected_size) updated.selected_size = extracted.selected_size
    if (extracted.selected_color) updated.selected_color = extracted.selected_color
    if (extracted.wilaya) updated.wilaya = extracted.wilaya
    if (extracted.delivery_mode) updated.delivery_mode = extracted.delivery_mode
    if (extracted.shipping_address) updated.shipping_address = extracted.shipping_address
    if (extracted.customer_name) updated.customer_name = extracted.customer_name
    if (extracted.customer_phone) updated.customer_phone = extracted.customer_phone
    updated.extra_data = mergedExtra
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
    const product = (products ?? []).find((p) => p.id === updated.product_id)
    const isPhysicalKind = (product?.kind ?? 'physical') === 'physical'
    const deliveryLabel = updated.delivery_mode === 'point_retrait' ? t.deliveryRelay : t.deliveryHome
    const extraLines = Object.entries(updated.extra_data ?? {})
      .map(([k, v]) => `• ${k} : ${v}`)
      .join('\n')

    replyText = [
      t.recap,
      '',
      `• ${t.labelProduct} : ${product?.name ?? updated.product_id}`,
      updated.selected_size ? `• ${t.labelSize} : ${updated.selected_size}` : null,
      updated.selected_color ? `• ${t.labelColor} : ${updated.selected_color}` : null,
      `• ${t.labelPrice} : ${product?.price ?? '?'} ${product?.currency ?? 'DZD'}`,
      `• ${t.labelName} : ${updated.customer_name}`,
      `• ${t.labelPhone} : ${updated.customer_phone}`,
      // Non-physical kinds (service/digital/subscription/event) never
      // collect wilaya/delivery/address — showing them here always
      // rendered as literal "null" for those shops.
      isPhysicalKind ? `• ${t.labelWilaya} : ${updated.wilaya}` : null,
      isPhysicalKind ? `• ${t.labelDelivery} : ${deliveryLabel}` : null,
      isPhysicalKind ? `• ${t.labelAddress} : ${updated.shipping_address}` : null,
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
    wilaya: updated.wilaya ?? null,
    delivery_mode: updated.delivery_mode ?? null,
    shipping_address: updated.shipping_address ?? null,
    customer_name: updated.customer_name ?? null,
    customer_phone: updated.customer_phone ?? null,
    extra_data: updated.extra_data ?? {},
  }

  await supabase.from('order_sessions').update(updates).eq('id', session.id)

  if (newStatus === 'confirmed') {
    const { data: finalSession } = await supabase.from('order_sessions').select('*, products(name, price, kind, currency)').eq('id', session.id).single()

    if (finalSession?.products) {
      const qty = finalSession.quantity || 1
      const isPhysical = (finalSession.products.kind ?? 'physical') === 'physical'

      // orders previously had no link back to contacts — just a denormalized
      // name/phone pair, unusable for anything purchase-aware (segments,
      // LTV, post-purchase flows). upsertContact already ran earlier in the
      // inbound pipeline for this sender_id, so the contact row exists.
      const { data: linkedContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('channel_account_id', finalSession.channel_account_id)
        .eq('sender_id', finalSession.sender_id)
        .maybeSingle()

      // sizes/colors on `products` were flat display tags with no per-combination
      // price/stock (see migration 20260822) — resolve a matching variant, if any,
      // and use its price/stock instead of the base product's.
      let unitPrice = finalSession.products.price
      let variantId: string | null = null
      if (finalSession.selected_size || finalSession.selected_color) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('id, price_override, stock_quantity')
          .eq('product_id', finalSession.product_id)
          .eq('size', finalSession.selected_size ?? null)
          .eq('color', finalSession.selected_color ?? null)
          .maybeSingle()
        if (variant) {
          variantId = variant.id
          if (variant.price_override !== null) unitPrice = variant.price_override
        }
      }

      // Promo codes have no dedicated extraction slot — they ride the generic
      // infos_to_collect → extra_data mechanism, so this checks the handful of
      // key spellings a merchant is likely to configure. Not exhaustive: a
      // custom field named something else won't be picked up here.
      const PROMO_KEYS = ['promo_code', 'code_promo', 'code promo', 'coupon', 'code de réduction', 'code réduction']
      const rawPromoCode = PROMO_KEYS.map((k) => finalSession.extra_data?.[k]).find(Boolean)
      let discountAmount = 0
      let appliedCode: string | null = null
      if (rawPromoCode) {
        const { data: redeemed } = await supabase.rpc('redeem_discount_code', {
          p_channel_account_id: finalSession.channel_account_id,
          p_code: String(rawPromoCode).trim().toUpperCase(),
        })
        if (redeemed) {
          const subtotal = unitPrice * qty
          discountAmount = redeemed.percent_off ? (subtotal * redeemed.percent_off) / 100 : (redeemed.amount_off ?? 0)
          appliedCode = redeemed.code
        }
      }

      const totalAmount = Math.max(unitPrice * qty - discountAmount, 0)

      const { error: insertError } = await supabase.from('orders').insert({
        channel_account_id: finalSession.channel_account_id,
        order_session_id: finalSession.id,
        contact_id: linkedContact?.id ?? null,
        customer_name: finalSession.customer_name ?? 'Inconnu',
        customer_phone: finalSession.customer_phone ?? 'Inconnu',
        wilaya: isPhysical ? (finalSession.wilaya ?? 'Inconnue') : finalSession.wilaya ?? null,
        delivery_mode: isPhysical ? (finalSession.delivery_mode ?? 'Inconnu') : finalSession.delivery_mode ?? null,
        shipping_address: isPhysical ? (finalSession.shipping_address ?? '') : finalSession.shipping_address ?? null,
        product_name: finalSession.products.name,
        currency: finalSession.products.currency ?? 'DZD',
        price: unitPrice,
        size: finalSession.selected_size,
        color: finalSession.selected_color,
        quantity: qty,
        total_amount: totalAmount,
        extra_data: { ...(finalSession.extra_data ?? {}), ...(appliedCode ? { applied_discount_code: appliedCode } : {}) },
      })

      if (insertError) {
        console.error('[Ecommerce] Order creation failed:', insertError)
        // `replyText` was already set to t.confirmed above — the customer
        // must not see a confirmation for an order that doesn't exist.
        // Revert the session to "awaiting confirmation" so a retry of
        // "oui" tries the insert again instead of silently doing nothing.
        replyText = t.recapConfirm
        await supabase.from('order_sessions').update({ status: 'gathering_info', awaiting_field: 'confirmation' }).eq('id', finalSession.id)
      } else {
        console.log(`[Ecommerce] Order created for session ${finalSession.id}`)
        await supabase.from('order_sessions').update({ status: 'confirmed' }).eq('id', finalSession.id)

        // Stock was never decremented anywhere — confirmed orders left
        // stock_quantity untouched, making "out of stock" badges decorative.
        // Atomic RPC (see migration 20260820) avoids a race between two
        // near-simultaneous orders on the same product. Non-physical kinds
        // (service/digital/subscription/event) don't track stock this way.
        if (isPhysical && variantId) {
          const { error: stockError } = await supabase.rpc('decrement_variant_stock', { p_variant_id: variantId, p_quantity: qty })
          if (stockError) console.error('[Ecommerce] Variant stock decrement failed:', stockError)
        } else if (isPhysical && finalSession.product_id) {
          const { error: stockError } = await supabase.rpc('decrement_product_stock', {
            p_product_id: finalSession.product_id,
            p_quantity: qty,
          })
          if (stockError) console.error('[Ecommerce] Stock decrement failed:', stockError)
        }
      }
    }
  }

  try {
    if (newlySelectedProduct?.image_url) {
      await sendCardReply(
        pageId,
        accessToken,
        senderId,
        newlySelectedProduct.name,
        `${newlySelectedProduct.price} ${newlySelectedProduct.currency ?? 'DA'}`,
        newlySelectedProduct.image_url
      )
    }
    await sendReply(pageId, accessToken, senderId, replyText, quickReplies)
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await supabase.from('channel_accounts').update({ is_active: false }).eq('id', accountId)
    }
    console.error('[Ecommerce] sendReply failed:', err)
  }
}

export async function handleEcommerceVoice({
  accountId,
  pageId,
  senderId,
  audioBuffer,
  mimeType,
  accessToken,
  customInstructions = [],
  infosToCollect = [],
  faqs = [],
  persona,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string
  pageId: string
  senderId: string
  audioBuffer: Buffer
  mimeType: string
  accessToken: string
  customInstructions?: string[]
  infosToCollect?: string[]
  faqs?: Array<{ question: string; answer: string }>
  persona?: string
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<string | null> {
  const transcription = await transcribeVoiceForEcommerce(audioBuffer, mimeType, aiProvider, aiApiKey)

  if (!transcription.trim()) {
    await sendReply(pageId, accessToken, senderId, "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire en texte ?")
    return null
  }

  console.log(`[Ecommerce/Voice] Transcription : "${transcription}"`)
  await handleEcommerceMessage({
    accountId,
    pageId,
    senderId,
    messageText: transcription,
    accessToken,
    customInstructions,
    infosToCollect,
    faqs,
    persona,
    aiProvider,
    aiApiKey,
    aiModel,
  })
  return transcription
}
