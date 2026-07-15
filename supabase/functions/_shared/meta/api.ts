const GRAPH_API_VERSION = 'v21.0'

/**
 * Custom error for expired tokens — allows callers to handle separately.
 */
export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

/**
 * Send a text message reply via the Instagram Messaging API.
 * Uses the Instagram Business Graph API (graph.instagram.com).
 */
interface SendReplyBody {
  recipient: { id: string }
  message: {
    text: string
    quick_replies?: Array<{ content_type: string; title: string; payload: string }>
  }
  messaging_type: string
}

export async function sendReply(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  messageText: string,
  quickReplies?: Array<{ title: string; payload: string }>
): Promise<{ message_id: string } | null> {
  const body: SendReplyBody = {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: 'RESPONSE',
  }

  if (quickReplies && quickReplies.length > 0) {
    body.message.quick_replies = quickReplies.slice(0, 13).map(qr => ({
      content_type: 'text',
      title: qr.title.substring(0, 20),
      payload: qr.payload.substring(0, 1000)
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
  } catch (err) {
    console.error('[fetchSenderProfile] Failed to fetch sender profile:', err)
    return null
  }
}
