import { describe, test, expect } from 'vitest'
import { checkOnboardingSecondWave } from '../../../../lib/ai/lint/rules/onboarding-second-wave'

const NOW = new Date('2026-08-04T00:00:00Z')

describe('checkOnboardingSecondWave', () => {
  test('flags an account past 60 days with fewer than 3 active automations', () => {
    const connectedAt = new Date('2026-06-01T00:00:00Z').toISOString() // 64 days before NOW
    const findings = checkOnboardingSecondWave({ id: 'a1', connectedAt }, 1, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'onboarding/second-wave', subjectId: 'a1', severity: 'warning', fixToolName: 'create_flow_draft' })
  })

  test('returns no findings before 60 days', () => {
    const connectedAt = new Date('2026-07-20T00:00:00Z').toISOString() // 15 days before NOW
    expect(checkOnboardingSecondWave({ id: 'a1', connectedAt }, 1, NOW)).toEqual([])
  })

  test('returns no findings once 3 or more automations are active', () => {
    const connectedAt = new Date('2026-06-01T00:00:00Z').toISOString()
    expect(checkOnboardingSecondWave({ id: 'a1', connectedAt }, 3, NOW)).toEqual([])
  })

  test('returns no findings when connectedAt is missing', () => {
    expect(checkOnboardingSecondWave({ id: 'a1', connectedAt: null }, 0, NOW)).toEqual([])
  })
})
