import { describe, test, expect } from 'vitest'
import { checkFlowNotEnabled } from '../../../../lib/ai/lint/rules/flow-not-enabled'

describe('checkFlowNotEnabled', () => {
  test('flags an active flow when the account kill-switch is off', () => {
    const findings = checkFlowNotEnabled({ id: 'f1', status: 'active' }, false)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/not-enabled', subjectId: 'f1', severity: 'error' })
  })

  test('returns no findings when the kill-switch is on', () => {
    expect(checkFlowNotEnabled({ id: 'f1', status: 'active' }, true)).toEqual([])
  })

  test('returns no findings for a draft flow even if the kill-switch is off', () => {
    expect(checkFlowNotEnabled({ id: 'f1', status: 'draft' }, false)).toEqual([])
  })
})
