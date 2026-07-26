import { describe, test, expect } from 'vitest'
import { checkFlowNoRuns } from '../../../../lib/ai/lint/rules/flow-no-runs'

const NOW = new Date('2026-08-04T00:00:00Z')
const NINE_DAYS_AGO = new Date('2026-07-26T00:00:00Z').toISOString()
const TWO_DAYS_AGO = new Date('2026-08-02T00:00:00Z').toISOString()

describe('checkFlowNoRuns', () => {
  test('flags an active flow older than 7 days with zero runs', () => {
    const findings = checkFlowNoRuns({ id: 'f1', status: 'active', created_at: NINE_DAYS_AGO }, 0, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/no-runs', subjectId: 'f1', severity: 'warning' })
  })

  test('returns no findings when the flow has runs', () => {
    expect(checkFlowNoRuns({ id: 'f1', status: 'active', created_at: NINE_DAYS_AGO }, 5, NOW)).toEqual([])
  })

  test('returns no findings when the flow is younger than 7 days', () => {
    expect(checkFlowNoRuns({ id: 'f1', status: 'active', created_at: TWO_DAYS_AGO }, 0, NOW)).toEqual([])
  })

  test('returns no findings for a non-active flow', () => {
    expect(checkFlowNoRuns({ id: 'f1', status: 'draft', created_at: NINE_DAYS_AGO }, 0, NOW)).toEqual([])
  })
})
