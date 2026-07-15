/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook POST.
 * Uses the native Web Crypto API (Deno-compatible — no Node.js dependencies).
 */
export async function verifyWebhookSignature(
  rawBody: string | ArrayBuffer,
  signature: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signature) return false

  // Signature format: "sha256=<hex_digest>"
  const parts = signature.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') return false

  const encoder = new TextEncoder()
  const keyData = encoder.encode(appSecret)
  
  const bodyData = typeof rawBody === 'string' 
    ? encoder.encode(rawBody) 
    : new Uint8Array(rawBody)

  // Import the app secret as an HMAC-SHA256 key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Compute the expected signature
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData)

  // Convert the received hex signature to bytes
  const receivedHex = parts[1]
  const receivedBytes = new Uint8Array(
    receivedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  )

  // Compare using timing-safe method
  const computedBytes = new Uint8Array(signatureBuffer)
  if (computedBytes.length !== receivedBytes.length) return false

  // Timing-safe comparison
  let result = 0
  for (let i = 0; i < computedBytes.length; i++) {
    result |= computedBytes[i] ^ receivedBytes[i]
  }

  return result === 0
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
        results.push({ pageId: entry.id, comment: change.value as WebhookCommentValue })
      }
    }
  }

  return results
}
