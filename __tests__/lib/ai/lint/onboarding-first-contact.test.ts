import { describe, test, expect } from 'vitest'
import { checkOnboardingFirstContact } from '../../../../lib/ai/lint/rules/onboarding-first-contact'

describe('checkOnboardingFirstContact', () => {
  test('flags exactly when the very first contact lands and no segment exists yet', () => {
    const findings = checkOnboardingFirstContact({ id: 'a1' }, 1, 0)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'onboarding/first-contact', subjectId: 'a1', severity: 'info', fixToolName: 'create_segment' })
  })

  test('returns no findings before the first contact', () => {
    expect(checkOnboardingFirstContact({ id: 'a1' }, 0, 0)).toEqual([])
  })

  test('returns no findings once past the first contact', () => {
    expect(checkOnboardingFirstContact({ id: 'a1' }, 5, 0)).toEqual([])
  })

  test('returns no findings once a segment already exists', () => {
    expect(checkOnboardingFirstContact({ id: 'a1' }, 1, 1)).toEqual([])
  })
})
