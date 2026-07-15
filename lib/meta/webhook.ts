import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook POST.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false

  // Signature format: "sha256=<hex_digest>"
  const parts = signature.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') return false

  const expectedSignature = createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex')

  try {
    return timingSafeEqual(
      Buffer.from(parts[1], 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────
// Webhook Payload Types
// ─────────────────────────────────────────────

export interface WebhookMessage {
  mid: string
  text?: string
  attachments?: Array<{ type: string; payload: { url?: string } }>
  reply_to?: { mid: string }
}

export interface WebhookMessaging {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: WebhookMessage
  postback?: { payload: string; title: string }
  reaction?: { action: string; emoji: string; mid: string }
}

export interface WebhookEntry {
  id: string // Page ID
  time: number
  messaging?: WebhookMessaging[]
  changes?: Array<{ field: string; value: unknown }>
}

export interface WebhookPayload {
  object: string // 'instagram' | 'page'
  entry: WebhookEntry[]
}

/**
 * Parse a raw Meta webhook payload and extract messaging events.
 * Returns only messaging events (DMs), not other change types.
 */
export function parseWebhookMessaging(
  payload: WebhookPayload
): Array<{ pageId: string; messaging: WebhookMessaging }> {
  const results: Array<{ pageId: string; messaging: WebhookMessaging }> = []

  if (payload.object !== 'instagram' && payload.object !== 'page') {
    return results
  }

  for (const entry of payload.entry) {
    if (!entry.messaging) continue
    for (const messaging of entry.messaging) {
      results.push({ pageId: entry.id, messaging })
    }
  }

  return results
}

/**
 * Parse a raw Meta webhook payload and extract comment events.
 */
export interface WebhookCommentValue {
  id: string
  from: {
    id: string
    username: string
  }
  text: string
  media?: {
    id: string
  }
}

export function parseWebhookComments(
  payload: WebhookPayload
): Array<{ pageId: string; comment: WebhookCommentValue }> {
  const results: Array<{ pageId: string; comment: WebhookCommentValue }> = []

  if (payload.object !== 'instagram' && payload.object !== 'page') {
    return results
  }

  for (const entry of payload.entry) {
    if (!entry.changes) continue
    for (const change of entry.changes) {
      if (change.field === 'comments') {
        // Only process newly created comments or similar. 
        // We ensure we cast it to WebhookCommentValue
        results.push({ pageId: entry.id, comment: change.value as WebhookCommentValue })
      }
    }
  }

  return results
}
