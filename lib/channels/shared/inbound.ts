import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../supabase/admin'
import { handleEcommerceMessage, handleEcommerceVoice, handleQaMessage } from '../../agent/ecommerce/handler'
import { handleAgentMessage, type BusinessType } from '../../agent/router'
import { TokenExpiredError } from '../../meta/messaging'
import { getAdapter } from '../registry'
import { findChannelAccountByExternalId } from './lookup'
import { upsertContact, getContact } from '../../contacts/service'
import { renderTemplate } from '../../personalization'
import { runFlowsForInbound, runFlowsForInboundComment, continueRunFromPostback, tryContinueRunFromTextCapture } from '../../flows/engine'
import type { ChannelAccountRef, NormalizedInboundMessage, NormalizedInboundComment, Platform } from '../types'

const GREETING_RE =
  /^(bonjour|salut|salam|hello|hi|hey|bonsoir|مرحبا|السلام عليكم|وعليكم السلام|كيداير|كيف|wesh|coucou|ola|yo)\b/i

const VERIFY_TOKEN_ENV: Record<Platform, string> = {
  instagram: 'META_WEBHOOK_VERIFY_TOKEN',
  messenger: 'META_MESSENGER_VERIFY_TOKEN',
  whatsapp: 'META_WHATSAPP_VERIFY_TOKEN',
}

async function isSubscriptionValid(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .single()

  const now = new Date()
  return (
    !subscription || // admin accounts have no subscription row
    (subscription.status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > now))
  )
}

async function deactivateAccount(accountId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('channel_accounts').update({ is_active: false }).eq('id', accountId)
}

/**
 * Mirrors the live supabase/functions/_shared/meta/messaging.ts::handleAutoReply
 * (Deno) — Q&A mode, order-taking tunnel with greeting-reset, configurable
 * default message — generalized behind a ChannelAdapter. Skips echo events
 * (sent BY the connected account) the same way the Deno webhook does today.
 */
export async function dispatchInboundMessage(msg: NormalizedInboundMessage): Promise<void> {
  if (msg.senderId === msg.recipientId || msg.senderId === msg.channelExternalId) return

  // ── Button click (postback) — resume the paused flow run directly,
  // never re-evaluate triggers from scratch. ─────────────────────────────
  if (msg.postbackPayload) {
    const account = await findChannelAccountByExternalId(msg.platform, msg.channelExternalId)
    if (!account || !(await isSubscriptionValid(account.user_id))) return

    const supabase = createAdminClient()
    const { data: agentSettings } = await supabase
      .from('agent_settings')
      .select('ai_provider, ai_api_key, ai_model')
      .eq('channel_account_id', account.id)
      .single()

    const { isEncrypted, decryptApiKey } = await import('../../crypto')
    let apiKey: string | null = agentSettings?.ai_api_key || null
    if (apiKey && isEncrypted(apiKey)) {
      try {
        apiKey = await decryptApiKey(apiKey)
      } catch {
        apiKey = null
      }
    }

    await continueRunFromPostback(
      msg.postbackPayload,
      msg.platform,
      { id: account.id, user_id: account.user_id, access_token: account.access_token },
      msg.senderId,
      { aiProvider: agentSettings?.ai_provider || null, aiApiKey: apiKey, aiModel: agentSettings?.ai_model || null }
    )
    return
  }

  // ── Text reply to a paused "capture_input" node — store it and resume
  // that run directly, before any trigger/Q&A/rules handling ever sees it. ──
  if (msg.text) {
    const account = await findChannelAccountByExternalId(msg.platform, msg.channelExternalId)
    if (account && (await isSubscriptionValid(account.user_id))) {
      const supabase = createAdminClient()
      const { data: agentSettings } = await supabase
        .from('agent_settings')
        .select('ai_provider, ai_api_key, ai_model')
        .eq('channel_account_id', account.id)
        .single()

      const { isEncrypted, decryptApiKey } = await import('../../crypto')
      let apiKey: string | null = agentSettings?.ai_api_key || null
      if (apiKey && isEncrypted(apiKey)) {
        try {
          apiKey = await decryptApiKey(apiKey)
        } catch {
          apiKey = null
        }
      }

      const consumed = await tryContinueRunFromTextCapture(
        msg.text,
        msg.platform,
        { id: account.id, user_id: account.user_id, access_token: account.access_token },
        msg.senderId,
        { aiProvider: agentSettings?.ai_provider || null, aiApiKey: apiKey, aiModel: agentSettings?.ai_model || null }
      )
      if (consumed) return
    }
  }

  if (!msg.text && !msg.audioUrl) return

  const account = await findChannelAccountByExternalId(msg.platform, msg.channelExternalId)
  if (!account) {
    console.warn(`[dispatchInboundMessage] No active account found for ${msg.platform}:${msg.channelExternalId}`)
    return
  }

  if (!(await isSubscriptionValid(account.user_id))) {
    console.warn(`[dispatchInboundMessage] Subscription inactive/expired — skipping reply`)
    return
  }

  const adapter = getAdapter(msg.platform)
  const ref: ChannelAccountRef = { id: account.id, externalId: msg.channelExternalId, accessToken: account.access_token }
  const supabase = createAdminClient()
  const pageId = msg.channelExternalId
  const senderProfile = await adapter.fetchSenderProfile?.(msg.senderId, account.access_token)
  const contactId = await upsertContact(account.id, msg.senderId, senderProfile)

  const { data: agentSettings } = await supabase.from('agent_settings').select('*').eq('channel_account_id', account.id).single()
  const { data: ownerProfile } = await supabase.from('profiles').select('business_type').eq('id', account.user_id).single()
  const businessType: BusinessType = (ownerProfile?.business_type as BusinessType) ?? 'ecommerce'

  const { isEncrypted, decryptApiKey } = await import('../../crypto')
  let resolvedApiKey: string | null = agentSettings?.ai_api_key || null
  if (resolvedApiKey && isEncrypted(resolvedApiKey)) {
    try {
      resolvedApiKey = await decryptApiKey(resolvedApiKey)
    } catch (err) {
      console.error('[dispatchInboundMessage] Failed to decrypt custom AI API key:', err)
      resolvedApiKey = null
    }
  }

  // The rich Q&A/order-taking tunnel below is ecommerce-specific — other
  // verticals are routed through lib/agent/router.ts::handleAgentMessage
  // (see the Scenario C block after the classic-rules fallback setup).
  const isQaActive = businessType === 'ecommerce' && (agentSettings?.is_qa_active ?? false)
  const isOrderTakingActive = businessType === 'ecommerce' && (agentSettings?.is_order_taking_active ?? false)

  // ── Voice notes ────────────────────────────────────────────────────────
  if (msg.audioUrl) {
    const { downloadAudio, processVoiceWithGemini } = await import('../../meta/voice')
    let audioBuffer: Buffer
    try {
      audioBuffer = await downloadAudio(msg.audioUrl, account.access_token)
    } catch (err) {
      console.error(`[dispatchInboundMessage] Failed to download audio for message ${msg.messageId}:`, err)
      return
    }
    const VOICE_MIME = 'audio/mp4'

    if (isOrderTakingActive) {
      const transcription = await handleEcommerceVoice({
        accountId: account.id,
        pageId,
        senderId: msg.senderId,
        audioBuffer,
        mimeType: VOICE_MIME,
        accessToken: account.access_token,
        customInstructions: agentSettings?.instructions || [],
        infosToCollect: agentSettings?.infos_to_collect || [],
        aiProvider: agentSettings?.ai_provider || null,
        aiApiKey: resolvedApiKey,
        aiModel: agentSettings?.ai_model || null,
      })
      const voiceMessageText = transcription ? `[🎙️ Vocal] : ${transcription}` : `[🎙️ Vocal] : [Échec de la transcription]`
      await supabase.from('message_logs').upsert(
        {
          channel_account_id: account.id,
          contact_id: contactId,
          sender_id: msg.senderId,
          sender_username: senderProfile?.username || null,
          sender_full_name: senderProfile?.name || null,
          sender_profile_pic: senderProfile?.profilePic || null,
          message_id: msg.messageId,
          message_text: voiceMessageText,
          direction: 'incoming',
          auto_reply_sent: true,
          reply_text: transcription
            ? '[Géré par Prise de Commande IA]'
            : "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire votre message en texte ?",
          replied_at: new Date().toISOString(),
        },
        { onConflict: 'message_id' }
      )
      return
    }

    const { data: voiceRules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('channel_account_id', account.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    const dmRules = (voiceRules || []).filter((rule) => rule.trigger_type === 'keyword' || rule.trigger_type === 'any_message')

    const geminiResult = await processVoiceWithGemini(audioBuffer, VOICE_MIME, dmRules)
    const voiceMessageText = `[🎙️ Vocal] : ${geminiResult.transcription}`

    await supabase.from('message_logs').upsert(
      {
        channel_account_id: account.id,
        contact_id: contactId,
        sender_id: msg.senderId,
        sender_username: senderProfile?.username || null,
        sender_full_name: senderProfile?.name || null,
        sender_profile_pic: senderProfile?.profilePic || null,
        message_id: msg.messageId,
        message_text: voiceMessageText,
        direction: 'incoming',
        auto_reply_sent: false,
      },
      { onConflict: 'message_id' }
    )

    try {
      const result = await adapter.sendMessage(ref, msg.senderId, geminiResult.replyText)
      if (result) {
        await supabase
          .from('message_logs')
          .update({ auto_reply_sent: true, reply_text: geminiResult.replyText, replied_at: new Date().toISOString() })
          .eq('message_id', msg.messageId)
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        await deactivateAccount(account.id)
      } else {
        console.error('[dispatchInboundMessage] Failed to send voice reply:', err)
      }
    }
    return
  }

  // ── Text messages ─────────────────────────────────────────────────────
  const messageText = msg.text ?? ''

  await supabase.from('message_logs').upsert(
    {
      channel_account_id: account.id,
      contact_id: contactId,
      sender_id: msg.senderId,
      sender_username: senderProfile?.username || null,
      sender_full_name: senderProfile?.name || null,
      sender_profile_pic: senderProfile?.profilePic || null,
      message_id: msg.messageId,
      message_text: messageText,
      direction: 'incoming',
      auto_reply_sent: false,
    },
    { onConflict: 'message_id' }
  )

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const { data: activeSession } = await supabase
    .from('order_sessions')
    .select('id')
    .eq('channel_account_id', account.id)
    .eq('sender_id', msg.senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  const agentArgs = {
    customInstructions: agentSettings?.instructions || [],
    infosToCollect: agentSettings?.infos_to_collect || [],
    aiProvider: agentSettings?.ai_provider || null,
    aiApiKey: resolvedApiKey,
    aiModel: agentSettings?.ai_model || null,
  }

  // ── Scenario 0: visual flows (opt-in via agent_settings.flows_enabled) ──
  // Checked first, ahead of the Q&A/order-taking agent and the classic
  // rules fallback below: a matching flow trigger is an explicit, specific
  // configuration and must take priority over the generic agent — otherwise
  // an account with Q&A/order-taking enabled would never reach this block
  // (both scenarios below return unconditionally) and flows would silently
  // never fire. Accounts without flows_enabled keep their exact current
  // behavior untouched.
  if (agentSettings?.flows_enabled) {
    const handled = await runFlowsForInbound({
      platform: msg.platform,
      account: { id: account.id, user_id: account.user_id, access_token: account.access_token },
      contactId,
      senderId: msg.senderId,
      messageText,
      agentArgs: { aiProvider: agentArgs.aiProvider, aiApiKey: agentArgs.aiApiKey, aiModel: agentArgs.aiModel },
    })
    if (handled) {
      await supabase
        .from('message_logs')
        .update({ auto_reply_sent: true, reply_text: '[Géré par Flow]', replied_at: new Date().toISOString() })
        .eq('message_id', msg.messageId)
      return
    }
  }

  // ── Scenario A: active order session → continue the tunnel (reset on greeting) ──
  if (activeSession && isOrderTakingActive) {
    if (GREETING_RE.test(messageText.trim())) {
      await supabase.from('order_sessions').update({ status: 'cancelled' }).eq('id', activeSession.id)

      if (isQaActive) {
        const { data: products } = await supabase.from('products').select('*').eq('channel_account_id', account.id).eq('is_active', true)
        await handleQaMessage({
          pageId,
          senderId: msg.senderId,
          messageText,
          accessToken: account.access_token,
          products: products ?? [],
          isOrderTakingActive,
          ...agentArgs,
        })
        await supabase
          .from('message_logs')
          .update({
            auto_reply_sent: true,
            reply_text: '[Géré par Assistant FAQ IA — salutation après reset]',
            replied_at: new Date().toISOString(),
          })
          .eq('message_id', msg.messageId)
      } else {
        const greeting = 'Bonjour ! Comment puis-je vous aider ? 😊'
        await adapter.sendMessage(ref, msg.senderId, greeting)
        await supabase
          .from('message_logs')
          .update({ auto_reply_sent: true, reply_text: greeting, replied_at: new Date().toISOString() })
          .eq('message_id', msg.messageId)
      }
      return
    }

    await handleEcommerceMessage({ accountId: account.id, pageId, senderId: msg.senderId, messageText, accessToken: account.access_token, ...agentArgs })
    await supabase
      .from('message_logs')
      .update({ auto_reply_sent: true, reply_text: '[Géré par Prise de Commande IA]', replied_at: new Date().toISOString() })
      .eq('message_id', msg.messageId)
    return
  }

  // ── Scenario B: no active session — Q&A and/or order-taking depending on flags ──
  if (isQaActive || isOrderTakingActive) {
    const { data: products } = await supabase.from('products').select('*').eq('channel_account_id', account.id).eq('is_active', true)

    if (isQaActive) {
      const { hasPurchaseIntent } = await handleQaMessage({
        pageId,
        senderId: msg.senderId,
        messageText,
        accessToken: account.access_token,
        products: products ?? [],
        isOrderTakingActive,
        skipReplyOnPurchaseIntent: isOrderTakingActive,
        ...agentArgs,
      })

      await supabase
        .from('message_logs')
        .update({ auto_reply_sent: true, reply_text: '[Géré par Assistant FAQ IA]', replied_at: new Date().toISOString() })
        .eq('message_id', msg.messageId)

      if (hasPurchaseIntent && isOrderTakingActive) {
        await handleEcommerceMessage({ accountId: account.id, pageId, senderId: msg.senderId, messageText, accessToken: account.access_token, ...agentArgs })
      }
      return
    }

    if (isOrderTakingActive) {
      await handleEcommerceMessage({ accountId: account.id, pageId, senderId: msg.senderId, messageText, accessToken: account.access_token, ...agentArgs })
      await supabase
        .from('message_logs')
        .update({ auto_reply_sent: true, reply_text: '[Géré par Prise de Commande IA]', replied_at: new Date().toISOString() })
        .eq('message_id', msg.messageId)
      return
    }
  }

  // ── Scenario C: coaching/agency verticals (simpler — one LLM call per turn) ──
  if (businessType !== 'ecommerce' && businessType !== 'generic' && agentSettings?.is_active) {
    const handled = await handleAgentMessage(businessType, {
      accountId: account.id,
      pageId,
      senderId: msg.senderId,
      messageText,
      accessToken: account.access_token,
      ...agentArgs,
    })
    if (handled) {
      await supabase
        .from('message_logs')
        .update({ auto_reply_sent: true, reply_text: `[Géré par Assistant IA — ${businessType}]`, replied_at: new Date().toISOString() })
        .eq('message_id', msg.messageId)
      return
    }
  }

  // ── Fallback: classic keyword/any_message rules + configurable default message ──
  let replyText: string | null = null
  let matchedRule: (typeof rules extends (infer T)[] | null ? T : never) | null = null
  if (rules && rules.length > 0) {
    const lowerText = messageText.toLowerCase()
    const keywordRule = rules.find(
      (rule) => rule.trigger_type === 'keyword' && rule.trigger_keywords?.some((kw: string) => lowerText.includes(kw.toLowerCase()))
    )
    const anyMessageRule = rules.find((rule) => rule.trigger_type === 'any_message')
    matchedRule = keywordRule ?? anyMessageRule ?? null
    replyText = matchedRule?.response_text ?? null
  }

  if (!replyText) {
    const defaultEnabled = agentSettings?.default_message_enabled ?? true
    const defaultText = agentSettings?.default_message_text ?? 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏'
    const defaultFreq = agentSettings?.default_message_frequency ?? 'always'

    if (defaultEnabled) {
      let shouldSend = true
      if (defaultFreq === 'first_message_only') {
        const { count } = await supabase
          .from('message_logs')
          .select('*', { count: 'exact', head: true })
          .eq('channel_account_id', account.id)
          .eq('sender_id', msg.senderId)
          .eq('direction', 'incoming')
        if (count && count > 1) shouldSend = false
      }
      if (shouldSend) replyText = defaultText
    }
  }

  if (!replyText) return

  try {
    const contact = contactId ? await getContact(account.id, contactId) : null
    replyText = renderTemplate(replyText, contact)

    const cardButtons = ((matchedRule?.card_buttons as Array<{ type?: 'postback' | 'web_url'; title: string; url?: string }>) ?? []).map(
      (b) => ({ ...b, title: renderTemplate(b.title, contact) })
    )
    const cardTitle = renderTemplate(matchedRule?.card_title || replyText, contact)
    const cardSubtitle = matchedRule?.card_subtitle ? renderTemplate(matchedRule.card_subtitle, contact) : undefined
    const isCard = matchedRule?.response_type === 'card'
    const hasImage = !!matchedRule?.card_image_url

    let result: { messageId: string } | null
    if (isCard && !hasImage && cardButtons.length > 0 && adapter.sendButtons) {
      result = await adapter.sendButtons(
        ref,
        msg.senderId,
        cardTitle,
        cardButtons.map((b) => ({ type: b.type ?? 'web_url', title: b.title, url: b.url }))
      )
    } else if (isCard && adapter.sendCard) {
      result = await adapter.sendCard(
        ref,
        msg.senderId,
        cardTitle,
        cardSubtitle,
        matchedRule?.card_image_url ?? undefined,
        cardButtons.map((b) => ({ title: b.title, url: b.url ?? '' }))
      )
    } else {
      result = await adapter.sendMessage(ref, msg.senderId, replyText)
    }
    if (result) {
      await supabase
        .from('message_logs')
        .update({ auto_reply_sent: true, reply_text: replyText, replied_at: new Date().toISOString() })
        .eq('message_id', msg.messageId)
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await deactivateAccount(account.id)
    } else {
      console.error('[dispatchInboundMessage] Failed to send reply:', err)
    }
  }
}

/** Mirrors lib/meta/comments.ts::handleCommentAutoReply, generalized behind a ChannelAdapter. */
export async function dispatchInboundComment(comment: NormalizedInboundComment): Promise<void> {
  if (comment.commenterId === comment.channelExternalId) return

  const account = await findChannelAccountByExternalId(comment.platform, comment.channelExternalId)
  if (!account) return
  if (!(await isSubscriptionValid(account.user_id))) return

  const supabase = createAdminClient()
  const contactId = await upsertContact(account.id, comment.commenterId, { username: comment.commenterUsername })

  await supabase.from('comment_logs').upsert(
    {
      channel_account_id: account.id,
      comment_id: comment.commentId,
      commenter_id: comment.commenterId,
      commenter_username: comment.commenterUsername,
      comment_text: comment.text,
      media_id: comment.mediaId || null,
      auto_reply_sent: false,
    },
    { onConflict: 'comment_id' }
  )

  const { data: agentSettings } = await supabase.from('agent_settings').select('flows_enabled, ai_provider, ai_api_key, ai_model').eq('channel_account_id', account.id).single()

  if (agentSettings?.flows_enabled) {
    const { isEncrypted, decryptApiKey } = await import('../../crypto')
    let apiKey: string | null = agentSettings.ai_api_key || null
    if (apiKey && isEncrypted(apiKey)) {
      try {
        apiKey = await decryptApiKey(apiKey)
      } catch {
        apiKey = null
      }
    }
    const handled = await runFlowsForInboundComment({
      platform: comment.platform,
      account: { id: account.id, user_id: account.user_id, access_token: account.access_token },
      contactId,
      senderId: comment.commenterId,
      commentText: comment.text,
      mediaId: comment.mediaId,
      agentArgs: { aiProvider: agentSettings.ai_provider || null, aiApiKey: apiKey, aiModel: agentSettings.ai_model || null },
    })
    if (handled) {
      await supabase
        .from('comment_logs')
        .update({ auto_reply_sent: true, reply_text: '[Géré par Flow]', replied_at: new Date().toISOString() })
        .eq('comment_id', comment.commentId)
      return
    }
  }

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const applicableRules = (rules || []).filter((rule) => {
    if (!['any_comment', 'comment_keyword'].includes(rule.trigger_type)) return false
    if (rule.target_post_ids?.length && comment.mediaId && !rule.target_post_ids.includes(comment.mediaId)) return false
    return true
  })

  applicableRules.sort((a, b) => {
    const aHasTarget = a.target_post_ids?.length > 0
    const bHasTarget = b.target_post_ids?.length > 0
    return aHasTarget === bHasTarget ? 0 : aHasTarget ? -1 : 1
  })

  const lowerText = comment.text.toLowerCase()
  const matchedRule =
    applicableRules.find(
      (rule) => rule.trigger_type === 'comment_keyword' && rule.trigger_keywords?.some((kw: string) => lowerText.includes(kw.toLowerCase()))
    ) ?? applicableRules.find((rule) => rule.trigger_type === 'any_comment')

  if (!matchedRule) return

  // Comment replies remain Instagram-only (no public-comment concept on
  // WhatsApp/Messenger's DM-only surface used here) — delegate to the
  // existing comment-reply helpers rather than the generic adapter.
  const { sendCommentReply, sendPrivateReplyToComment, sendPrivateButtonReplyToComment, sendPrivateCardReplyToComment } = await import(
    '../../meta/comments'
  )
  const commentContact = contactId ? await getContact(account.id, contactId) : null
  const replyText = renderTemplate(matchedRule.response_text, commentContact)
  const replyMethod = matchedRule.reply_method || 'comment'
  const isCard = matchedRule.response_type === 'card'
  const cardButtons = (
    (matchedRule.card_buttons as Array<{ type?: 'postback' | 'web_url'; title: string; url?: string }>) ?? []
  ).map((b) => ({ ...b, title: renderTemplate(b.title, commentContact) }))

  async function sendDm(dmText: string) {
    if (isCard) {
      return matchedRule.card_image_url
        ? sendPrivateCardReplyToComment(
            comment.channelExternalId,
            comment.commentId,
            account!.access_token,
            renderTemplate(matchedRule.card_title || dmText, commentContact),
            matchedRule.card_subtitle ? renderTemplate(matchedRule.card_subtitle, commentContact) : undefined,
            matchedRule.card_image_url ?? undefined,
            cardButtons
          )
        : sendPrivateButtonReplyToComment(
            comment.channelExternalId,
            comment.commentId,
            account!.access_token,
            renderTemplate(matchedRule.card_title || dmText, commentContact),
            cardButtons
          )
    }
    return sendPrivateReplyToComment(comment.channelExternalId, comment.commentId, account!.access_token, dmText)
  }

  try {
    let result = null
    if (replyMethod === 'both') {
      result = await sendCommentReply(comment.commentId, account.access_token, replyText)
      const dmText = matchedRule.response_text_dm ? renderTemplate(matchedRule.response_text_dm, commentContact) : replyText
      await sendDm(dmText)
    } else if (replyMethod === 'dm') {
      result = await sendDm(replyText)
    } else {
      result = await sendCommentReply(comment.commentId, account.access_token, replyText)
    }

    if (result) {
      await supabase
        .from('comment_logs')
        .update({ auto_reply_sent: true, reply_text: replyText, replied_at: new Date().toISOString() })
        .eq('comment_id', comment.commentId)
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await deactivateAccount(account.id)
    } else {
      console.error('[dispatchInboundComment] Failed to send reply:', err)
    }
  }
}

/**
 * Builds the GET (verification challenge) + POST (event delivery) handlers
 * for a platform's webhook route under app/api/webhooks/[platform]/route.ts.
 */
export function createWebhookRoute(platform: Platform) {
  async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = process.env[VERIFY_TOKEN_ENV[platform]]

    if (mode === 'subscribe' && token === verifyToken) {
      return new NextResponse(challenge, { status: 200 })
    }
    return new NextResponse('Forbidden', { status: 403 })
  }

  async function POST(request: NextRequest) {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const appSecret = process.env.META_APP_SECRET ?? ''
    const adapter = getAdapter(platform)

    if (!adapter.verifyWebhookSignature(rawBody, signature, appSecret)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const messages = adapter.parseWebhookMessages(payload)
    const comments = adapter.parseWebhookComments(payload)

    for (const msg of messages) {
      try {
        await dispatchInboundMessage(msg)
      } catch (err) {
        console.error(`[webhook:${platform}] Error handling message ${msg.messageId}:`, err)
      }
    }

    for (const comment of comments) {
      try {
        await dispatchInboundComment(comment)
      } catch (err) {
        console.error(`[webhook:${platform}] Error handling comment ${comment.commentId}:`, err)
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  }

  return { GET, POST }
}
