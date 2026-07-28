import { describe, test, expect } from 'vitest'
import { checkOnboardingSingleChannel } from '../../../../lib/ai/lint/rules/onboarding-single-channel'

describe('checkOnboardingSingleChannel', () => {
  test('flags a single connected channel once a real message has proven it works', () => {
    const findings = checkOnboardingSingleChannel({ id: 'a1' }, 1, true)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'onboarding/single-channel', subjectId: 'a1', severity: 'info' })
  })

  test('returns no findings before any real message has come in — avoids competing with the activation checklist', () => {
    expect(checkOnboardingSingleChannel({ id: 'a1' }, 1, false)).toEqual([])
  })

  test('returns no findings once a second channel is connected', () => {
    expect(checkOnboardingSingleChannel({ id: 'a1' }, 2, true)).toEqual([])
  })
})
