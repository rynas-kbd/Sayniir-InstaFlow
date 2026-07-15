import { createAdminClient } from '../../supabase/admin'
import { sendReply, TokenExpiredError } from '../../meta/messaging'
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
import { transcribeVoiceForEcommerce } from './voice'

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
  isOrderTakingActive?: boolean
  skipReplyOnPurchaseIntent?: boolean
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<{ hasPurchaseIntent: boolean }> {
  const productList = products
    .map((p) => {
      const extras = [
        `${p.price} DA`,
        ...(p.sizes?.length ? [`tailles: ${p.sizes.join('/')}`] : []),
        ...(p.colors?.length ? [`couleurs: ${p.colors.join('/')}`] : []),
      ].join(' — ')
      return `• ${p.name} (${extras})`
    })
    .join('\n')

  const orderHint = isOrderTakingActive
    ? `Si le client veut commander (ex: "je veux commander", "comment commander"), mets hasPurchaseIntent = true.`
    : `hasPurchaseIntent doit toujours être false.`

  const prompt = `
Tu es un assistant e-commerce pour une boutique Instagram algérienne.
Tu réponds aux questions des clients sur le catalogue, les prix, les tailles, la livraison.
Tu ne prends pas de commandes.

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}

=== CATALOGUE ===
${productList || 'Aucun produit actif.'}

=== MESSAGE ===
"${messageText}"

=== TÂCHES ===
1. Détecte la langue : "fr", "ar", "darija", ou "en".
2. Réponds de manière chaleureuse et précise dans la langue du client.
3. ${orderHint}

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
    await sendReply(pageId, accessToken, senderId, 'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.')
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

  const isConfirmation = isConfirmationMessage(messageText)
  const isCancellation = isCancellationMessage(messageText)
  const persistedLang = session.detected_language as string | null

  const extraDataKeys = customInfos.map((i) => i.toLowerCase().trim())
  const sessionContext = isNewSession
    ? "C'est le PREMIER message du client. Si c'est une salutation, note-le dans isQuestion."
    : `La session est EN COURS. État actuel :\n${JSON.stringify(
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

  const prompt = `
Tu es l'agent de vente d'une boutique e-commerce algérienne.

=== CONTEXTE SESSION ===
${sessionContext}

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}

=== CATALOGUE ===
${JSON.stringify(products, null, 2)}

=== MESSAGE CLIENT ===
"${messageText}"

=== TES TÂCHES ===
1. Langue du client : "fr", "ar", "darija", "en". Si incertain → "fr".
2. Extrais toutes les données de commande présentes dans le message.
3. Détermine isQuestion :
   - true UNIQUEMENT si : (a) salutation sur nouvelle session, (b) vraie question sur produits/prix/tailles/livraison
   - false si : le client donne une info de commande (nom, téléphone, adresse, taille, couleur, wilaya, etc.)
   - RÈGLE : session en cours + message interprétable comme donnée → isQuestion = false
4. Si isQuestion = true → questionReply = réponse dans la langue du client. Sinon null.

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
  "questionReply": "réponse ou null",
  "detectedLanguage": "fr | ar | darija | en"
}`

  let llmResult: EcommerceLlmResult
  try {
    llmResult = await callAgentLLM<EcommerceLlmResult>(prompt, aiProvider, aiApiKey, aiModel)
  } catch (err) {
    console.error('[Ecommerce] LLM error:', err)
    await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
    return
  }

  const lang = persistedLang ?? llmResult.detectedLanguage ?? 'fr'
  const t = getTemplate(lang)

  const extracted: ExtractedFields = llmResult.extractedData ?? {}

  extracted.delivery_mode = normalizeDeliveryMode(extracted.delivery_mode, messageText)
  if (extracted.customer_phone) extracted.customer_phone = normalizeAlgerianPhone(extracted.customer_phone)

  const mergedExtra: Record<string, string> = { ...(session.extra_data ?? {}) }
  if (extracted.extra_data && typeof extracted.extra_data === 'object') {
    for (const [key, val] of Object.entries(extracted.extra_data)) {
      if (val && val !== 'null') mergedExtra[key.toLowerCase().trim()] = val as string
    }
  }

  const updated = { ...session }
  if (extracted.product_id) updated.product_id = extracted.product_id
  if (extracted.selected_size) updated.selected_size = extracted.selected_size
  if (extracted.selected_color) updated.selected_color = extracted.selected_color
  if (extracted.wilaya) updated.wilaya = extracted.wilaya
  if (extracted.delivery_mode) updated.delivery_mode = extracted.delivery_mode
  if (extracted.shipping_address) updated.shipping_address = extracted.shipping_address
  if (extracted.customer_name) updated.customer_name = extracted.customer_name
  if (extracted.customer_phone) updated.customer_phone = extracted.customer_phone
  updated.extra_data = mergedExtra

  const looksLikeDeliveryChoice =
    /^(domicile|maison|chez moi|point.?retrait|retrait|relais|bureau|stop|الدار|المنزل|البيت|نقطة|استلام)$/i.test(messageText.trim())

  if (
    !updated.shipping_address &&
    !isConfirmation &&
    !isCancellation &&
    !looksLikeDeliveryChoice &&
    updated.delivery_mode &&
    messageText.trim().length >= 10
  ) {
    const missing = getMissingFields(updated, products ?? [], customInfos)
    if (missing[0] === 'adresse complète') {
      updated.shipping_address = messageText.trim()
    }
  }

  const missing = getMissingFields(updated, products ?? [], customInfos)
  const allDone = missing.length === 0

  let replyText: string
  let newStatus: string
  let quickReplies: Array<{ title: string; payload: string }> | undefined

  if (isCancellation) {
    replyText = t.cancelled
    newStatus = 'cancelled'
  } else if (isConfirmation && allDone) {
    replyText = t.confirmed
    newStatus = 'confirmed'
  } else if (allDone) {
    const product = (products ?? []).find((p) => p.id === updated.product_id)
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
      `• ${t.labelPrice} : ${product?.price ?? '?'} DA`,
      `• ${t.labelName} : ${updated.customer_name}`,
      `• ${t.labelPhone} : ${updated.customer_phone}`,
      `• ${t.labelWilaya} : ${updated.wilaya}`,
      `• ${t.labelDelivery} : ${deliveryLabel}`,
      `• ${t.labelAddress} : ${updated.shipping_address}`,
      extraLines || null,
      '',
      t.recapConfirm,
    ]
      .filter((l) => l !== null)
      .join('\n')
    newStatus = 'gathering_info'

    quickReplies = [
      { title: lang === 'fr' ? 'Oui' : lang === 'en' ? 'Yes' : lang === 'darija' ? 'واه' : 'نعم', payload: 'oui' },
      { title: lang === 'fr' ? 'Non' : lang === 'en' ? 'No' : 'لا', payload: 'non' },
    ]
  } else {
    newStatus = 'gathering_info'
    const nextQuestion = getNextQuestion(missing[0], updated, products ?? [], t, isNewSession)
    quickReplies = nextQuestion.quickReplies

    if (llmResult.isQuestion && llmResult.questionReply) {
      replyText = `${llmResult.questionReply}\n\n${nextQuestion.text}`
    } else {
      replyText = nextQuestion.text
    }
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    detected_language: lang,
    last_message_at: new Date().toISOString(),
    extra_data: mergedExtra,
  }
  if (extracted.product_id) updates.product_id = extracted.product_id
  if (extracted.selected_size) updates.selected_size = extracted.selected_size
  if (extracted.selected_color) updates.selected_color = extracted.selected_color
  if (extracted.wilaya) updates.wilaya = extracted.wilaya
  if (extracted.delivery_mode) updates.delivery_mode = extracted.delivery_mode
  if (extracted.customer_name) updates.customer_name = extracted.customer_name
  if (extracted.customer_phone) updates.customer_phone = extracted.customer_phone
  if (updated.shipping_address) updates.shipping_address = updated.shipping_address

  await supabase.from('order_sessions').update(updates).eq('id', session.id)

  if (newStatus === 'confirmed') {
    const { data: finalSession } = await supabase.from('order_sessions').select('*, products(name, price)').eq('id', session.id).single()

    if (finalSession?.products) {
      const qty = finalSession.quantity || 1
      const { error: insertError } = await supabase.from('orders').insert({
        channel_account_id: finalSession.channel_account_id,
        order_session_id: finalSession.id,
        customer_name: finalSession.customer_name ?? 'Inconnu',
        customer_phone: finalSession.customer_phone ?? 'Inconnu',
        wilaya: finalSession.wilaya ?? 'Inconnue',
        delivery_mode: finalSession.delivery_mode ?? 'Inconnu',
        shipping_address: finalSession.shipping_address ?? '',
        product_name: finalSession.products.name,
        price: finalSession.products.price,
        size: finalSession.selected_size,
        color: finalSession.selected_color,
        quantity: qty,
        total_amount: finalSession.products.price * qty,
        extra_data: finalSession.extra_data ?? {},
      })

      if (insertError) {
        console.error('[Ecommerce] Order creation failed:', insertError)
      } else {
        console.log(`[Ecommerce] Order created for session ${finalSession.id}`)
        await supabase.from('order_sessions').update({ status: 'confirmed' }).eq('id', finalSession.id)
      }
    }
  }

  try {
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
    aiProvider,
    aiApiKey,
    aiModel,
  })
  return transcription
}
