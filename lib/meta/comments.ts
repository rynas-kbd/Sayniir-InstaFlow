import { createAdminClient } from '../supabase/admin.ts'
import { TokenExpiredError } from './messaging.ts'
import { resolveAccessToken } from '../channels/shared/tokens.ts'

const GRAPH_API_VERSION = 'v21.0'

/**
 * Minimal shape of an `automation_rules` row, covering only the fields
 * this module reads/writes. See supabase/schema.sql for the full table.
 */
interface CardButtonLite {
  type?: 'postback' | 'web_url'
  title: string
  url?: string
}

interface AutomationRule {
  trigger_type: string
  trigger_keywords?: string[] | null
  target_post_ids?: string[] | null
  response_text: string
  response_text_dm?: string | null
  reply_method?: string | null
  response_type?: 'text' | 'card' | null
  card_title?: string | null
  card_subtitle?: string | null
  card_image_url?: string | null
  card_buttons?: CardButtonLite[] | null
}

/**
 * Send a reply to an Instagram comment publicly.
 */
export async function sendCommentReply(
  commentId: string,
  accessToken: string,
  messageText: string
): Promise<{ id: string } | null> {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${commentId}/replies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message: messageText }),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendCommentReply] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for comment ${commentId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendCommentReply] ✅ Replied to comment ${commentId}:`, messageText)
  return { id: data.id as string }
}

/**
 * Send a private message (DM) reply to an Instagram comment.
 */
export async function sendPrivateReplyToComment(
  pageId: string,
  commentId: string,
  accessToken: string,
  messageText: string
): Promise<{ message_id: string } | null> {
  const body = {
    recipient: { comment_id: commentId },
    message: { text: messageText },
  }

  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${pageId}/messages`,
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
    console.error('[sendPrivateReplyToComment] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for page ${pageId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendPrivateReplyToComment] ✅ DM sent for comment ${commentId}:`, messageText)
  return { message_id: data.message_id as string }
}

/**
 * Private DM reply to a comment, as a Button Template (text + up to 3
 * buttons, no image required). Attempted directly on Instagram — falls
 * back to formatted text if the API rejects it.
 */
export async function sendPrivateButtonReplyToComment(
  pageId: string,
  commentId: string,
  accessToken: string,
  text: string,
  buttons: CardButtonLite[]
): Promise<{ message_id: string } | null> {
  const body = {
    recipient: { comment_id: commentId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text.substring(0, 640),
          buttons: buttons.slice(0, 3).map((b) =>
            (b.type ?? 'web_url') === 'web_url'
              ? { type: 'web_url', title: b.title.substring(0, 20), url: b.url }
              : { type: 'postback', title: b.title.substring(0, 20), payload: b.title }
          ),
        },
      },
    },
  }

  const res = await fetch(`https://graph.instagram.com/${GRAPH_API_VERSION}/${pageId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendPrivateButtonReplyToComment] Meta API error, falling back to text:', JSON.stringify(data.error))
    if (data.error?.code === 190) throw new TokenExpiredError(`Access token expired for page ${pageId}: ${data.error.message}`)
    const lines = [text, '', ...buttons.map((b) => ((b.type ?? 'web_url') === 'web_url' ? `👉 ${b.title}: ${b.url}` : `👉 ${b.title}`))]
    return sendPrivateReplyToComment(pageId, commentId, accessToken, lines.join('\n'))
  }

  console.log(`[sendPrivateButtonReplyToComment] ✅ Button DM sent for comment ${commentId}`)
  return { message_id: data.message_id as string }
}

/**
 * Private DM reply to a comment, as a Generic Template card (title/image).
 * Instagram is known not to support this — always falls back to formatted text.
 */
export async function sendPrivateCardReplyToComment(
  pageId: string,
  commentId: string,
  accessToken: string,
  title: string,
  subtitle: string | undefined,
  imageUrl: string | undefined,
  buttons: CardButtonLite[]
): Promise<{ message_id: string } | null> {
  const lines: string[] = [`📋 *${title}*`]
  if (subtitle) lines.push(subtitle)
  if (imageUrl) lines.push(`🖼️ ${imageUrl}`)
  if (buttons.length > 0) {
    lines.push('')
    for (const btn of buttons.slice(0, 3)) {
      lines.push((btn.type ?? 'web_url') === 'web_url' ? `👉 ${btn.title}: ${btn.url}` : `👉 ${btn.title}`)
    }
  }
  return sendPrivateReplyToComment(pageId, commentId, accessToken, lines.join('\n'))
}

