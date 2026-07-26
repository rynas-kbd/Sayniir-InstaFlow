import { describe, test, expect } from 'vitest'
import { checkCampaignFailedSends } from '../../../../lib/ai/lint/rules/campaign-failed-sends'

describe('checkCampaignFailedSends', () => {
  test('flags a completed campaign with a failure rate above 10%', () => {
    const findings = checkCampaignFailedSends({ id: 'c1', status: 'sent' }, 80, 20)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'campaign/failed-sends', subjectId: 'c1', severity: 'warning' })
  })

  test('returns no findings when the failure rate is at or below 10%', () => {
    expect(checkCampaignFailedSends({ id: 'c1', status: 'sent' }, 90, 10)).toEqual([])
  })

  test('returns no findings for a campaign still in progress', () => {
    expect(checkCampaignFailedSends({ id: 'c1', status: 'sending' }, 0, 50)).toEqual([])
  })

  test('returns no findings when nothing was sent or failed', () => {
    expect(checkCampaignFailedSends({ id: 'c1', status: 'sent' }, 0, 0)).toEqual([])
  })
})
