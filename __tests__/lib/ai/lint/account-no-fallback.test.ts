import { describe, test, expect } from 'vitest'
import { checkAccountNoFallback } from '../../../../lib/ai/lint/rules/account-no-fallback'

describe('checkAccountNoFallback', () => {
  test('flags when neither the default message nor a generic flow covers unmatched messages', () => {
    const findings = checkAccountNoFallback({ id: 'a1' }, false, false)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'account/no-fallback', subjectId: 'a1', severity: 'warning' })
  })

  test('returns no findings when the default message is enabled', () => {
    expect(checkAccountNoFallback({ id: 'a1' }, true, false)).toEqual([])
  })

  test('returns no findings when a generic flow covers it', () => {
    expect(checkAccountNoFallback({ id: 'a1' }, false, true)).toEqual([])
  })
})
