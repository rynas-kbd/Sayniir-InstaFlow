import type { BillingPeriod } from '@/lib/plans'

/**
 * Computes the new expires_at after a successful checkout. If the current
 * subscription is still in the future, the new period stacks on top of it
 * instead of restarting from `now` — an early renewal must not throw away
 * days the customer already paid for.
 */
export function computeExpiresAt(current: Date | null, period: BillingPeriod, now: Date): Date {
  const base = current && current.getTime() > now.getTime() ? current : now
  const next = new Date(base)
  if (period === 'annual') {
    next.setFullYear(next.getFullYear() + 1)
  } else {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}
