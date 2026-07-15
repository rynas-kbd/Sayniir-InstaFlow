import { createAdminClient } from '../supabaseClient.ts'
import { handleEcommerceMessage, handleEcommerceVoice, handleQaMessage } from './ecommerce.ts'
import { downloadAudio, processVoiceWithGemini } from './voice.ts'
import { sendReply, TokenExpiredError, fetchSenderProfile } from './api.ts'
import { decryptApiKey, isEncrypted } from '../crypto.ts'

/**
 * Shape of an `automation_rules` row as consumed by the keyword/fallback
 * matching logic in this file. Only the fields read here are declared.
 */
interface AutomationRule {
  trigger_type: string
  trigger_keywords?: string[] | null
  response_text: string
}

/**
 * Full auto-reply orchestration:
 * 1. Look up the instagram_account in DB by pageId
 * 2. Fetch automation rules for that account
 * 3. Match a rule (keyword or fallback)
 * 4. Send the reply via Meta API
 * 5. Log the incoming message and outgoing reply
 */
export async function handleAutoReply({
  pageId,
  senderId,
  messageId,
  messageText,
}: {
  pageId: string
  senderId: string
  messageId: string
  messageText: string
}): Promise<void> {
  const supabase = createAdminClient()

  // 1. Look up the account by page_id
  const { data: account, error: accountError } = await supabase
    .from('channel_accounts')
    .select('id, access_token, is_active, user_id')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .single()

  if (accountError || !account) {
    console.warn(`[handleAutoReply] No active account found for pageId: ${pageId}`)
    return
  }

  if (isEncrypted(account.access_token)) {
    account.access_token = await decryptApiKey(account.access_token)
  }

  // 1b. Check subscription is active and not expired
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', account.user_id)
    .single()

  const now = new Date()
  const isSubscriptionValid =
    !subscription || // admin accounts have no subscription row
    (subscription.status === 'active' &&
      (!subscription.expires_at || new Date(subscription.expires_at) > now))

  if (!isSubscriptionValid) {
    console.warn(`[handleAutoReply] Subscription inactive/expired for pageId: ${pageId} — skipping reply`)
    return
  }

  // Fetch sender profile info from Meta API
  const senderProfile = await fetchSenderProfile(senderId, account.access_token)

  // 2. Log the incoming message
  await supabase.from('message_logs').upsert(
    {
      channel_account_id: account.id,
      sender_id: senderId,
      sender_username: senderProfile?.username || null,
      sender_full_name: senderProfile?.name || null,
      sender_profile_pic: senderProfile?.profile_pic || null,
      message_id: messageId,
      message_text: messageText,
      direction: 'incoming',
      auto_reply_sent: false,
    },
    { onConflict: 'message_id' }
  )

  // 3. Fetch active automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // 3b. Fetch ecommerce settings
  const { data: ecommerceSettings } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('channel_account_id', account.id)
    .single()

  let resolvedApiKey = ecommerceSettings?.ai_api_key || null
  if (resolvedApiKey && isEncrypted(resolvedApiKey)) {
    try {
      resolvedApiKey = await decryptApiKey(resolvedApiKey)
    } catch (err) {
      console.error('[Messaging] Failed to decrypt custom AI API key in handleAutoReply:', err)
      resolvedApiKey = null
    }
  }

  // 4. Check for active e-commerce order session
  const { data: activeSession } = await supabase
    .from('order_sessions')
    .select('id')
    .eq('channel_account_id', account.id)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  const isQaActive = ecommerceSettings?.is_qa_active ?? false
  const isOrderTakingActive = ecommerceSettings?.is_order_taking_active ?? false

  // ── Scenario A: Session de commande active → on continue le tunnel ──────────
  // IMPORTANT: Si une session est en cours, on ignore le mode Q&A pour éviter
  // que le bot réponde "Bonjour" au milieu d'une collecte d'infos commande.
  if (activeSession && isOrderTakingActive) {
    // Si le client envoie une salutation → c'est un nouveau départ, on réinitialise la session
    const isGreeting = /^(bonjour|salut|salam|hello|hi|hey|bonsoir|مرحبا|السلام عليكم|وعليكم السلام|كيداير|كيف|wesh|coucou|ola|yo)\b/i.test(messageText.trim())
    if (isGreeting) {
      console.log(`[Messaging] 👋 Greeting detected — resetting stale session for ${senderId}`)
      await supabase
        .from('order_sessions')
        .update({ status: 'cancelled' })
        .eq('id', activeSession.id)
      // On répond à la salutation via le mode Q&A si actif, ou par un message d'accueil simple.
      // On NE relance PAS handleEcommerceMessage ici : le client doit envoyer un vrai 1er message.
      if (isQaActive) {
        const { data: products } = await supabase
          .from('products').select('*')
          .eq('channel_account_id', account.id).eq('is_active', true)
        await handleQaMessage({
          pageId, senderId, messageText,
          accessToken: account.access_token,
          products: products ?? [],
          customInstructions: ecommerceSettings?.instructions || [],
          isOrderTakingActive,
          aiProvider: ecommerceSettings?.ai_provider || null,
          aiApiKey: resolvedApiKey,
          aiModel: ecommerceSettings?.ai_model || null,
        })
        await supabase.from('message_logs').update({
          auto_reply_sent: true,
          reply_text: '[Géré par Assistant FAQ IA — salutation après reset]',
          replied_at: new Date().toISOString(),
        }).eq('message_id', messageId)
      } else {
        // Pas de Q&A : juste un message d'accueil neutre
        await sendReply(pageId, account.access_token, senderId, 'Bonjour ! Comment puis-je vous aider ? 😊')
        await supabase.from('message_logs').update({
          auto_reply_sent: true,
          reply_text: 'Bonjour ! Comment puis-je vous aider ? 😊',
          replied_at: new Date().toISOString(),
        }).eq('message_id', messageId)
      }
      return
    } else {
      console.log(`[Messaging] 📦 Active session found for ${senderId} — routing to ecommerce`)
      await handleEcommerceMessage({
        accountId: account.id,
        pageId,
        senderId,
        messageText,
        accessToken: account.access_token,
        customInstructions: ecommerceSettings?.instructions || [],
        infosToCollect: ecommerceSettings?.infos_to_collect || [],
        aiProvider: ecommerceSettings?.ai_provider || null,
        aiApiKey: resolvedApiKey,
        aiModel: ecommerceSettings?.ai_model || null,
      })
      await supabase.from('message_logs').update({
        auto_reply_sent: true,
        reply_text: '[Géré par Prise de Commande IA]',
        replied_at: new Date().toISOString(),
      }).eq('message_id', messageId)
      return
    }
  }


  // ── Scenario B: Pas de session active — on regarde les modes activés ────────
  if (isQaActive || isOrderTakingActive) {
    // Récupère le catalogue une seule fois
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('channel_account_id', account.id)
      .eq('is_active', true)

    // Mode Q&A activé → l'assistant répond et détecte les intentions d'achat
    if (isQaActive) {
      const { hasPurchaseIntent } = await handleQaMessage({
        pageId,
        senderId,
        messageText,
        accessToken: account.access_token,
        products: products ?? [],
        customInstructions: ecommerceSettings?.instructions || [],
        isOrderTakingActive,
        skipReplyOnPurchaseIntent: isOrderTakingActive,
        aiProvider: ecommerceSettings?.ai_provider || null,
        aiApiKey: resolvedApiKey,
        aiModel: ecommerceSettings?.ai_model || null,
      })

      await supabase.from('message_logs').update({
        auto_reply_sent: true,
        reply_text: '[Géré par Assistant FAQ IA]',
        replied_at: new Date().toISOString(),
      }).eq('message_id', messageId)

      // Si le client veut commander ET que la prise de commande est activée,
      // on initie le tunnel mais on NE renvoie PAS de réponse QA en plus.
      // handleEcommerceMessage() prend en charge l'envoi de la réponse.
      if (hasPurchaseIntent && isOrderTakingActive) {
        console.log(`[Messaging] 🛒 Purchase intent detected — starting order session for ${senderId}`)
        await handleEcommerceMessage({
          accountId: account.id,
          pageId,
          senderId,
          messageText,
          accessToken: account.access_token,
          customInstructions: ecommerceSettings?.instructions || [],
          infosToCollect: ecommerceSettings?.infos_to_collect || [],
          aiProvider: ecommerceSettings?.ai_provider || null,
          aiApiKey: resolvedApiKey,
          aiModel: ecommerceSettings?.ai_model || null,
        })
      }
      return
    }

    // Mode Prise de Commande seul (sans Q&A)
    if (isOrderTakingActive) {
      await handleEcommerceMessage({
        accountId: account.id,
        pageId,
        senderId,
        messageText,
        accessToken: account.access_token,
        customInstructions: ecommerceSettings?.instructions || [],
        infosToCollect: ecommerceSettings?.infos_to_collect || [],
        aiProvider: ecommerceSettings?.ai_provider || null,
        aiApiKey: resolvedApiKey,
        aiModel: ecommerceSettings?.ai_model || null,
      })
      await supabase.from('message_logs').update({
        auto_reply_sent: true,
        reply_text: '[Géré par Prise de Commande IA]',
        replied_at: new Date().toISOString(),
      }).eq('message_id', messageId)
      return
    }
  }

  // 5. Règles d'automatisation classiques (keyword / any_message)
  let replyText: string | null = null

  if (rules && rules.length > 0) {
    const lowerText = messageText.toLowerCase()

    // Try keyword match for regular rules
    const keywordRule = rules.find(
      (rule: AutomationRule) =>
        rule.trigger_type === 'keyword' &&
        rule.trigger_keywords?.some((kw: string) =>
          lowerText.includes(kw.toLowerCase())
        )
    )

    // Fallback to "any_message" rule
    const anyMessageRule = rules.find(
      (rule: AutomationRule) => rule.trigger_type === 'any_message'
    )

    replyText = keywordRule?.response_text ?? anyMessageRule?.response_text ?? null
  }

  // Default reply if no rules configured
  if (!replyText) {
    const defaultEnabled = ecommerceSettings?.default_message_enabled ?? true;
    const defaultText = ecommerceSettings?.default_message_text ?? 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏';
    const defaultFreq = ecommerceSettings?.default_message_frequency ?? 'always';

    if (defaultEnabled) {
      let shouldSend = true;
      if (defaultFreq === 'first_message_only') {
        // Check if there are previous incoming messages (current message was inserted at start)
        const { count, error: countError } = await supabase
          .from('message_logs')
          .select('*', { count: 'exact', head: true })
          .eq('channel_account_id', account.id)
          .eq('sender_id', senderId)
          .eq('direction', 'incoming');
          
        if (!countError && count && count > 1) {
          shouldSend = false;
        }
      }
      
      if (shouldSend) {
        replyText = defaultText;
      }
    }
  }

  // 5. Send the reply
  if (replyText) {
    try {
      const result = await sendReply(
        pageId,
        account.access_token,
        senderId,
        replyText
      )

      if (result) {
        // 6. Update the log entry with reply info
        await supabase
          .from('message_logs')
          .update({
            auto_reply_sent: true,
            reply_text: replyText,
            replied_at: new Date().toISOString(),
          })
          .eq('message_id', messageId)

        console.log(
          `[handleAutoReply] Replied to ${senderId} on page ${pageId}: "${replyText}"`
        )
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        // Mark account as needing token refresh
        await supabase
          .from('channel_accounts')
          .update({ is_active: false })
          .eq('id', account.id)
        console.error('[handleAutoReply] Token expired — account deactivated:', pageId)
      } else {
        console.error('[handleAutoReply] Failed to send reply:', err)
      }
    }
  }
}

/**
 * Voice auto-reply orchestration:
 * 1. Look up the instagram_account in DB by pageId
 * 2. Fetch sender profile info
 * 3. Download the audio file from the Meta webhook URL
 * 4. Call Gemini 1.5 Flash to transcribe and find the matching rule
 * 5. Log the incoming message (with transcribed text)
 * 6. Send the reply via Meta API
 * 7. Update logs
 */
export async function handleVoiceAutoReply({
  pageId,
  senderId,
  messageId,
  audioUrl,
}: {
  pageId: string
  senderId: string
  messageId: string
  audioUrl: string
}): Promise<void> {
  const supabase = createAdminClient()

  // 1. Look up the account by page_id
  const { data: account, error: accountError } = await supabase
    .from('channel_accounts')
    .select('id, access_token, is_active, user_id')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .single()

  if (accountError || !account) {
    console.warn(`[handleVoiceAutoReply] No active account found for pageId: ${pageId}`)
    return
  }

  if (isEncrypted(account.access_token)) {
    account.access_token = await decryptApiKey(account.access_token)
  }

  // 1b. Check subscription is active and not expired
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', account.user_id)
    .single()

  const now = new Date()
  const isSubscriptionValid =
    !subscription || // admin accounts have no subscription row
    (subscription.status === 'active' &&
      (!subscription.expires_at || new Date(subscription.expires_at) > now))

  if (!isSubscriptionValid) {
    console.warn(`[handleVoiceAutoReply] Subscription inactive/expired for pageId: ${pageId} — skipping reply`)
    return
  }

  // Fetch sender profile info from Meta API
  const senderProfile = await fetchSenderProfile(senderId, account.access_token)

  // 2. Download the audio file
  let audioBuffer: Uint8Array
  try {
    audioBuffer = await downloadAudio(audioUrl, account.access_token)
  } catch (err) {
    console.error(`[handleVoiceAutoReply] Failed to download audio for message ${messageId}:`, err)
    return
  }

  // 3a. Fetch ecommerce settings
  const { data: ecommerceSettings } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('channel_account_id', account.id)
    .single()

  let resolvedApiKey = ecommerceSettings?.ai_api_key || null
  if (resolvedApiKey && isEncrypted(resolvedApiKey)) {
    try {
      resolvedApiKey = await decryptApiKey(resolvedApiKey)
    } catch (err) {
      console.error('[Messaging] Failed to decrypt custom AI API key in handleVoiceAutoReply:', err)
      resolvedApiKey = null
    }
  }

  // 3b. Check for active e-commerce session
  const { data: activeSession } = await supabase
    .from('order_sessions')
    .select('id')
    .eq('channel_account_id', account.id)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  const voiceIsOrderTakingActive = ecommerceSettings?.is_order_taking_active ?? false

  // Meta envoie les vocaux Instagram en audio/mp4 (conteneur AAC).
  // On utilise une constante pour éviter la duplication et simplifier un futur changement.
  const INSTAGRAM_VOICE_MIME = 'audio/mp4'

  // Session active en cours → tunnel de commande vocal
  if (activeSession && voiceIsOrderTakingActive) {
    const transcription = await handleEcommerceVoice({
      accountId: account.id,
      pageId,
      senderId,
      audioBuffer,
      mimeType: INSTAGRAM_VOICE_MIME,
      accessToken: account.access_token,
      customInstructions: ecommerceSettings?.instructions || [],
      infosToCollect: ecommerceSettings?.infos_to_collect || [],
      aiProvider: ecommerceSettings?.ai_provider || null,
      aiApiKey: resolvedApiKey,
      aiModel: ecommerceSettings?.ai_model || null,
    })

    const messageText = transcription ? `[🎙️ Vocal] : ${transcription}` : `[🎙️ Vocal] : [Échec de la transcription]`

    await supabase.from('message_logs').upsert(
      {
        channel_account_id: account.id,
        sender_id: senderId,
        sender_username: senderProfile?.username || null,
        sender_full_name: senderProfile?.name || null,
        sender_profile_pic: senderProfile?.profile_pic || null,
        message_id: messageId,
        message_text: messageText,
        direction: 'incoming',
        auto_reply_sent: true,
        reply_text: transcription ? '[Géré par Prise de Commande IA]' : "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire votre message en texte ?",
        replied_at: new Date().toISOString(),
      },
      { onConflict: 'message_id' }
    )
    return
  }

  // Pas de session active : démarrage du tunnel de commande si activé
  if (voiceIsOrderTakingActive) {
    const transcription = await handleEcommerceVoice({
      accountId: account.id,
      pageId,
      senderId,
      audioBuffer,
      mimeType: INSTAGRAM_VOICE_MIME,
      accessToken: account.access_token,
      customInstructions: ecommerceSettings?.instructions || [],
      infosToCollect: ecommerceSettings?.infos_to_collect || [],
      aiProvider: ecommerceSettings?.ai_provider || null,
      aiApiKey: resolvedApiKey,
      aiModel: ecommerceSettings?.ai_model || null,
    })

    const messageText = transcription ? `[🎙️ Vocal] : ${transcription}` : `[🎙️ Vocal] : [Échec de la transcription]`

    await supabase.from('message_logs').upsert(
      {
        channel_account_id: account.id,
        sender_id: senderId,
        sender_username: senderProfile?.username || null,
        sender_full_name: senderProfile?.name || null,
        sender_profile_pic: senderProfile?.profile_pic || null,
        message_id: messageId,
        message_text: messageText,
        direction: 'incoming',
        auto_reply_sent: true,
        reply_text: transcription ? '[Géré par Prise de Commande IA]' : "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire votre message en texte ?",
        replied_at: new Date().toISOString(),
      },
      { onConflict: 'message_id' }
    )
    return
  }


  // 3c. Fetch active automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Filter rules only related to DMs: trigger_type is 'keyword' or 'any_message'
  const dmRules = (rules || []).filter(
    (rule: AutomationRule) => rule.trigger_type === 'keyword' || rule.trigger_type === 'any_message'
  )

  // 4. Process audio with Gemini (transcription & rule matching)
  console.log(`[handleVoiceAutoReply] Processing voice note with Gemini 1.5 Flash...`)
  const geminiResult = await processVoiceWithGemini(
    audioBuffer,
    'audio/mp4', // Meta voice attachments are typically mp4 audio/m4a
    dmRules
  )

  const messageText = `[🎙️ Vocal] : ${geminiResult.transcription}`
  const replyText = geminiResult.replyText

  console.log(`[handleVoiceAutoReply] Transcribed: "${geminiResult.transcription}"`)
  console.log(`[handleVoiceAutoReply] Match result - Language: ${geminiResult.detectedLanguage}, Rule: ${geminiResult.matchedRuleId}`)

  // 5. Log the incoming message
  await supabase.from('message_logs').upsert(
    {
      channel_account_id: account.id,
      sender_id: senderId,
      sender_username: senderProfile?.username || null,
      sender_full_name: senderProfile?.name || null,
      sender_profile_pic: senderProfile?.profile_pic || null,
      message_id: messageId,
      message_text: messageText,
      direction: 'incoming',
      auto_reply_sent: false,
    },
    { onConflict: 'message_id' }
  )

  // 6. Send the reply
  try {
    const result = await sendReply(
      pageId,
      account.access_token,
      senderId,
      replyText
    )

    if (result) {
      // 7. Update the log entry with reply info
      await supabase
        .from('message_logs')
        .update({
          auto_reply_sent: true,
          reply_text: replyText,
          replied_at: new Date().toISOString(),
        })
        .eq('message_id', messageId)

      console.log(
        `[handleVoiceAutoReply] Replied to ${senderId} on page ${pageId}: "${replyText}"`
      )
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      // Mark account as needing token refresh
      await supabase
        .from('channel_accounts')
        .update({ is_active: false })
        .eq('id', account.id)
      console.error('[handleVoiceAutoReply] Token expired — account deactivated:', pageId)
    } else {
      console.error('[handleVoiceAutoReply] Failed to send reply:', err)
    }
  }
}