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
 * Send a card reply via Instagram or Messenger.
 *
 * IMPORTANT: The Instagram Business API (graph.instagram.com) does NOT support
 * generic template cards. Only the Messenger API (graph.facebook.com) supports them.
 *
 * Strategy:
 * - If `useMessengerApi` is true → use graph.facebook.com with a generic template
 * - Otherwise → send a formatted text message on graph.instagram.com
 */
export async function sendCardReply(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  title: string,
  subtitle?: string,
  imageUrl?: string,
  buttons?: Array<{ title: string; url: string }>,
  useMessengerApi = false
): Promise<{ message_id: string } | null> {

  if (useMessengerApi) {
    // ── Messenger path: generic template card (Facebook Page DMs) ──────────
    const element: Record<string, unknown> = { title: title.substring(0, 80) }
    if (subtitle) element.subtitle = subtitle.substring(0, 80)
    if (imageUrl) element.image_url = imageUrl
    if (buttons && buttons.length > 0) {
      element.buttons = buttons.slice(0, 3).map((b) => ({
        type: 'web_url',
        url: b.url,
        title: b.title.substring(0, 20),
      }))
    }

    const body = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: { template_type: 'generic', elements: [element] },
        },
      },
      messaging_type: 'RESPONSE',
    }

    console.log(`[sendCardReply] Sending Messenger generic template to ${recipientId} via pageId ${igUserId}`)
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igUserId}/messages`,
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
      console.error('[sendCardReply] Messenger API error:', JSON.stringify(data.error))
      if (data.error?.code === 190) throw new TokenExpiredError(`Access token expired for ${igUserId}: ${data.error.message}`)
      return null
    }
    console.log(`[sendCardReply] ✅ Sent Messenger card to ${recipientId}:`, title)
    return { message_id: data.message_id as string }
  }

  // ── Instagram path: generic templates NOT supported → send formatted text ──
  // Build a rich text representation of the card
  const lines: string[] = []
  lines.push(`📋 *${title}*`)
  if (subtitle) lines.push(subtitle)
  if (imageUrl) lines.push(`🖼️ ${imageUrl}`)
  if (buttons && buttons.length > 0) {
    lines.push('')
    for (const btn of buttons.slice(0, 3)) {
      lines.push(`👉 ${btn.title}: ${btn.url}`)
    }
  }
  const textFallback = lines.join('\n')

  console.log(`[sendCardReply] Instagram does not support generic templates — sending formatted text to ${recipientId} via ${igUserId}`)
  return sendReply(igUserId, accessToken, recipientId, textFallback)
}

export interface ButtonMessageButton {
  type: 'postback' | 'web_url'
  title: string
  url?: string
  payload?: string
}

/**
 * Send a "Button Template" message (text + up to 3 buttons, no title/image required).
 * Unlike the Generic Template, this is attempted directly on Instagram
 * (graph.instagram.com) since buttons of this kind are known to work there in
 * production. Falls back to a formatted text message if the API rejects it.
 */
export async function sendButtonMessage(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  text: string,
  buttons: ButtonMessageButton[],
  useMessengerApi = false
): Promise<{ message_id: string } | null> {
  const body = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text.substring(0, 640),
          buttons: buttons.slice(0, 3).map((b) =>
            b.type === 'postback'
              ? { type: 'postback', title: b.title.substring(0, 20), payload: (b.payload ?? '').substring(0, 1000) }
              : { type: 'web_url', title: b.title.substring(0, 20), url: b.url }
          ),
        },
      },
    },
    messaging_type: 'RESPONSE',
  }

  const baseUrl = useMessengerApi ? 'https://graph.facebook.com' : 'https://graph.instagram.com'

  try {
    const res = await fetch(`${baseUrl}/${GRAPH_API_VERSION}/${igUserId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[sendButtonMessage] Meta API error, falling back to text:', JSON.stringify(data.error))
      if (data.error?.code === 190) throw new TokenExpiredError(`Access token expired for ${igUserId}: ${data.error.message}`)
      return sendButtonTextFallback(igUserId, accessToken, recipientId, text, buttons)
    }

    console.log(`[sendButtonMessage] ✅ Sent button template to ${recipientId}`)
    return { message_id: data.message_id as string }
  } catch (err) {
    if (err instanceof TokenExpiredError) throw err
    console.error('[sendButtonMessage] Request failed, falling back to text:', err)
    return sendButtonTextFallback(igUserId, accessToken, recipientId, text, buttons)
  }
}

function sendButtonTextFallback(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  text: string,
  buttons: ButtonMessageButton[]
): Promise<{ message_id: string } | null> {
  const lines = [text]
  if (buttons.length > 0) {
    lines.push('')
    for (const btn of buttons) {
      lines.push(btn.type === 'web_url' ? `👉 ${btn.title}: ${btn.url}` : `👉 ${btn.title}`)
    }
  }
  return sendReply(igUserId, accessToken, recipientId, lines.join('\n'))
}


/**
 * Show the native "typing…" indicator to a recipient. Best-effort: never
 * throws, since this is purely cosmetic and must not break a flow.
 */
export async function sendTypingIndicator(igUserId: string, accessToken: string, recipientId: string): Promise<void> {
  try {
    const res = await fetch(`https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ recipient: { id: recipientId }, sender_action: 'typing_on' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      console.error('[sendTypingIndicator] Meta API error:', JSON.stringify(data?.error))
    }
  } catch (err) {
    console.error('[sendTypingIndicator] Request failed:', err)
  }
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

