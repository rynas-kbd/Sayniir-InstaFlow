import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook POST.
 * Shared across Instagram, Messenger and WhatsApp — all three sign payloads
 * the same way (HMAC-SHA256 over the raw body with the app secret).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false

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
