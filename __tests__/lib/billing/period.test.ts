import { describe, test, expect } from 'vitest'
import { computeExpiresAt } from '@/lib/billing/period'

describe('computeExpiresAt', () => {
  const now = new Date('2026-09-04T00:00:00Z')

  test('null current expiry → now + period (monthly)', () => {
    const result = computeExpiresAt(null, 'monthly', now)
    expect(result.toISOString()).toBe('2026-10-04T00:00:00.000Z')
  })

  test('null current expiry → now + period (annual)', () => {
    const result = computeExpiresAt(null, 'annual', now)
    expect(result.toISOString()).toBe('2027-09-04T00:00:00.000Z')
  })

  test('a future expiry stacks the new period on top instead of restarting from now', () => {
    const future = new Date('2026-09-20T00:00:00Z')
    const result = computeExpiresAt(future, 'monthly', now)
    expect(result.toISOString()).toBe('2026-10-20T00:00:00.000Z')
  })

  test('a past expiry restarts from now, it does not stack on the stale date', () => {
    const past = new Date('2026-08-01T00:00:00Z')
    const result = computeExpiresAt(past, 'monthly', now)
    expect(result.toISOString()).toBe('2026-10-04T00:00:00.000Z')
  })

  test('an expiry exactly equal to now is treated as not-future — restarts from now', () => {
    const result = computeExpiresAt(new Date(now), 'monthly', now)
    expect(result.toISOString()).toBe('2026-10-04T00:00:00.000Z')
  })
})
