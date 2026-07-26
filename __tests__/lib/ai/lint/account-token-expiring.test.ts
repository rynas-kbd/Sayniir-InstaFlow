import { describe, test, expect } from 'vitest'
import { checkAccountTokenExpiring } from '../../../../lib/ai/lint/rules/account-token-expiring'

const NOW = new Date('2026-08-04T00:00:00Z')

describe('checkAccountTokenExpiring', () => {
  test('returns no findings when there is no expiry set', () => {
    expect(checkAccountTokenExpiring({ id: 'a1', token_expires_at: null }, 3, NOW)).toEqual([])
  })

  test('returns no findings when expiry is more than 7 days away', () => {
    const farOut = new Date('2026-08-20T00:00:00Z').toISOString()
    expect(checkAccountTokenExpiring({ id: 'a1', token_expires_at: farOut }, 3, NOW)).toEqual([])
  })

  test('flags with warning severity between 48h and 7 days', () => {
    const inFourDays = new Date('2026-08-08T00:00:00Z').toISOString()
    const findings = checkAccountTokenExpiring({ id: 'a1', token_expires_at: inFourDays }, 3, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('warning')
  })

  test('flags with error severity under 48h', () => {
    const inOneDay = new Date('2026-08-05T00:00:00Z').toISOString()
    const findings = checkAccountTokenExpiring({ id: 'a1', token_expires_at: inOneDay }, 3, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('error')
  })
})
