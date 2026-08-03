/**
 * In-memory, per-instance rate limiter. No Redis/Upstash infra exists in this
 * repo today (confirmed: no KV/Redis env vars, no such dependency in
 * package.json) — this is a pragmatic stopgap that bounds cost-per-instance
 * without provisioning new infra. On a multi-instance serverless deployment
 * each instance tracks its own counters, so the effective limit is
 * `limit * instanceCount`, not a hard global cap. Good enough to stop a
 * single abusive client hammering one endpoint; not a substitute for a
 * shared store (Upstash Ratelimit) if/when this needs to be a hard guarantee.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Bound memory: sweep expired buckets once in a while rather than on every call.
let lastSweep = Date.now()
const SWEEP_INTERVAL_MS = 60_000

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Fixed-window counter keyed by caller-supplied `key` (typically
 * `${routeName}:${userId}`). Returns `allowed: false` once `limit` calls have
 * been made inside the current `windowMs` window.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}
