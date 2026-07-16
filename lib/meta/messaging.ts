import { createAdminClient } from '../supabase/admin'
import { downloadAudio, processVoiceWithGemini } from './voice'
import { handleEcommerceMessage } from './ecommerce'
import { resolveAccessToken } from '../channels/shared/tokens'

const GRAPH_API_VERSION = 'v21.0'

/**
 * Send a text message reply via the Instagram Messaging API.
 * Uses the Instagram Business Graph API (graph.instagram.com).
 */
export interface QuickReply {
  title: string
  payload: string
}

export async function sendReply(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  messageText: string,
  quickReplies?: QuickReply[]
): Promise<{ message_id: string } | null> {
  const body: {
    recipient: { id: string }
    message: { text: string; quick_replies?: Array<{ content_type: string; title: string; payload: string }> }
    messaging_type: string
  } = {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: 'RESPONSE',
  }

  if (quickReplies && quickReplies.length > 0) {
    body.message.quick_replies = quickReplies.slice(0, 13).map((qr) => ({
      content_type: 'text',
      title: qr.title.substring(0, 20),
      payload: qr.payload.substring(0, 1000),
    }))
  }

  // New Instagram Business API endpoint
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendReply] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for ${igUserId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendReply] ✅ Sent to ${recipientId}:`, messageText)
  return { message_id: data.message_id as string }
}

/**
 * Send a generic template card reply via the Instagram/Messenger Messaging API.
 */
export async function sendCardReply(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  title: string,
  subtitle?: string,
  imageUrl?: string,
  buttons?: Array<{ title: string; url: string }>
): Promise<{ message_id: string } | null> {
  const body: any = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: title.substring(0, 80),
            }
          ]
        }
      }
    },
    messaging_type: 'RESPONSE',
  }

  const element = body.message.attachment.payload.elements[0]

  if (subtitle) {
    element.subtitle = subtitle.substring(0, 80)
  }
  if (imageUrl) {
    element.image_url = imageUrl
  }
  if (buttons && buttons.length > 0) {
    element.buttons = buttons.slice(0, 3).map((b) => ({
      type: 'web_url',
      url: b.url,
      title: b.title.substring(0, 20)
    }))
  }

  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendCardReply] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for ${igUserId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendCardReply] ✅ Sent card to ${recipientId}:`, title)
  return { message_id: data.message_id as string }
}


/**
 * Custom error for expired tokens — allows callers to handle separately.
 */
export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

export async function fetchSenderProfile(
  senderId: string,
  accessToken: string
): Promise<{ name?: string; profile_pic?: string; username?: string } | null> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${senderId}?fields=name,profile_pic,username&access_token=${accessToken}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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

  account.access_token = await resolveAccessToken(account.access_token)

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

  // 3b. Fetch agent settings
  const { data: ecommerceSettings } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('channel_account_id', account.id)
    .single()

  // 4. Check for active e-commerce session
  const { data: activeSession } = await supabase
    .from('order_sessions')
    .select('id')
    .eq('channel_account_id', account.id)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  if (activeSession) {
    // We are in an active e-commerce flow
    await handleEcommerceMessage({
      accountId: account.id,
      pageId,
      senderId,
      messageText,
      accessToken: account.access_token,
      instructions: ecommerceSettings?.instructions || [],
      infosToCollect: ecommerceSettings?.infos_to_collect || [],
      aiProvider: ecommerceSettings?.ai_provider || null,
      aiApiKey: ecommerceSettings?.ai_api_key || null,
      aiModel: ecommerceSettings?.ai_model || null,
    });
    
    // Update log entry
    await supabase
      .from('message_logs')
      .update({
        auto_reply_sent: true,
        reply_text: '[Géré par IA E-commerce]',
        replied_at: new Date().toISOString(),
      })
      .eq('message_id', messageId)

    return;
  }

  // 5. Match a rule
  let replyText: string | null = null

  if (rules && rules.length > 0) {
    const lowerText = messageText.toLowerCase()

    // Check for ecommerce agent trigger first
    if (ecommerceSettings?.is_active) {
      await handleEcommerceMessage({
        accountId: account.id,
        pageId,
        senderId,
        messageText,
        accessToken: account.access_token,
        instructions: ecommerceSettings.instructions || [],
        infosToCollect: ecommerceSettings.infos_to_collect || [],
        aiProvider: ecommerceSettings.ai_provider || null,
        aiApiKey: ecommerceSettings.ai_api_key || null,
        aiModel: ecommerceSettings.ai_model || null,
      });

      // Update log entry
      await supabase
        .from('message_logs')
        .update({
          auto_reply_sent: true,
          reply_text: '[Géré par IA E-commerce]',
          replied_at: new Date().toISOString(),
        })
        .eq('message_id', messageId)

      return;
    }

    // Try keyword match for regular rules
    const keywordRule = rules.find(
      (rule) =>
        rule.trigger_type === 'keyword' &&
        rule.trigger_keywords?.some((kw: string) =>
          lowerText.includes(kw.toLowerCase())
        )
    )

    // Fallback to "any_message" rule
    const anyMessageRule = rules.find(
      (rule) => rule.trigger_type === 'any_message'
    )

    replyText = keywordRule?.response_text ?? anyMessageRule?.response_text ?? null
  }

  // Default reply if no rules configured
  if (!replyText) {
    replyText = 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏'
  }

  // 5. Send the reply
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

  account.access_token = await resolveAccessToken(account.access_token)

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
  let audioBuffer: Buffer
  try {
    audioBuffer = await downloadAudio(audioUrl, account.access_token)
  } catch (err) {
    console.error(`[handleVoiceAutoReply] Failed to download audio for message ${messageId}:`, err)
    return
  }

  // 3. Fetch active automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Filter rules only related to DMs: trigger_type is 'keyword' or 'any_message'
  const dmRules = (rules || []).filter(
    (rule) => rule.trigger_type === 'keyword' || rule.trigger_type === 'any_message'
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

