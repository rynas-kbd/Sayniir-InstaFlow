import { describe, test, expect } from 'vitest'
import { checkCampaignWindow24h } from '../../../../lib/ai/lint/rules/campaign-window-24h'

const NOW = new Date('2026-08-04T12:00:00Z')

describe('checkCampaignWindow24h', () => {
  test('flags contacts that last wrote in over 24h ago', () => {
    const audience = [
      { is_subscribed: true, last_inbound_at: '2026-08-01T00:00:00Z' },
      { is_subscribed: true, last_inbound_at: '2026-08-04T11:00:00Z' },
    ]

    const findings = checkCampaignWindow24h({ id: 'c1' }, audience, NOW)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'campaign/window-24h', subjectId: 'c1', severity: 'error' })
    expect(findings[0].title).toContain('1')
  })

  test('flags contacts that have never written in', () => {
    const findings = checkCampaignWindow24h({ id: 'c1' }, [{ is_subscribed: true, last_inbound_at: null }], NOW)
    expect(findings).toHaveLength(1)
  })

  test('returns no findings when every contact is within the window', () => {
    const audience = [{ is_subscribed: true, last_inbound_at: '2026-08-04T11:00:00Z' }]
    expect(checkCampaignWindow24h({ id: 'c1' }, audience, NOW)).toEqual([])
  })
})
