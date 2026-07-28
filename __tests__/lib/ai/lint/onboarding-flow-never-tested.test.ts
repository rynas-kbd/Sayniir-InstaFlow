import { describe, test, expect } from 'vitest'
import { checkOnboardingFlowNeverTested } from '../../../../lib/ai/lint/rules/onboarding-flow-never-tested'

describe('checkOnboardingFlowNeverTested', () => {
  test('flags an active automation that has never received a real message', () => {
    const findings = checkOnboardingFlowNeverTested({ id: 'a1' }, true, 0)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'onboarding/flow-never-tested', subjectId: 'a1', severity: 'info' })
    expect(findings[0].fixToolName).toBeUndefined()
  })

  test('returns no findings when there is no active automation yet', () => {
    expect(checkOnboardingFlowNeverTested({ id: 'a1' }, false, 0)).toEqual([])
  })

  test('returns no findings once a real message has come in', () => {
    expect(checkOnboardingFlowNeverTested({ id: 'a1' }, true, 3)).toEqual([])
  })
})
