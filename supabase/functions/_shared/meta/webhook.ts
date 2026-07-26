/**
 * Constant-time string comparison (Deno-compatible — no Node.js `crypto`
 * dependency). Used for the hub.verify_token handshake, which is a shared
 * secret and shouldn't be compared with plain `===`.
 */
export function safeEqualStr(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook POST.
 * Uses the native Web Crypto API (Deno-compatible — no Node.js dependencies).
 */
export async function verifyWebhookSignature(
  rawBody: string | ArrayBuffer,
  signature: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signature || !appSecret) return false

  // Signature format: "sha256=<hex_digest>"
  const parts = signature.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') return false

  // Reject anything that isn't valid hex before .match() — an empty or
  // malformed hex string (e.g. "sha256=") previously threw on the
  // non-null-asserted .match() call, surfacing as an unhandled 500 instead
  // of a clean 401.
  const receivedHex = parts[1]
  if (!/^[0-9a-f]+$/i.test(receivedHex) || receivedHex.length % 2 !== 0) return false

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
