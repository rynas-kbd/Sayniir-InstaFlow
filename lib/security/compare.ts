import { timingSafeEqual } from 'crypto'

/**
 * Constant-time string comparison for secrets (verify tokens, cron secrets).
 * Plain `!==`/`===` on secret values leaks timing information proportional to
 * the number of matching leading bytes; this doesn't, and fails closed on
 * length mismatch instead of throwing (timingSafeEqual requires equal-length
 * buffers).
 */
export function safeEqualStr(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
