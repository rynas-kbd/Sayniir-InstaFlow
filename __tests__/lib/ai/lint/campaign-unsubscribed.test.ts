import { describe, test, expect } from 'vitest'
import { checkCampaignUnsubscribed } from '../../../../lib/ai/lint/rules/campaign-unsubscribed'

describe('checkCampaignUnsubscribed', () => {
  test('flags unsubscribed contacts in the audience', () => {
    const audience = [
      { is_subscribed: false, last_inbound_at: null },
      { is_subscribed: true, last_inbound_at: null },
    ]

    const findings = checkCampaignUnsubscribed({ id: 'c1' }, audience)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'campaign/unsubscribed', subjectId: 'c1', severity: 'error' })
  })

  test('returns no findings when every contact is subscribed', () => {
    const audience = [{ is_subscribed: true, last_inbound_at: null }]
    expect(checkCampaignUnsubscribed({ id: 'c1' }, audience)).toEqual([])
  })
})
