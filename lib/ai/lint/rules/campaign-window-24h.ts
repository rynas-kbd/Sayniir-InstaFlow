import type { LintFinding } from '../types.ts'

const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000

export interface CampaignAudienceContact {
  is_subscribed: boolean
  last_inbound_at: string | null
}

/** Contacts outside Meta's 24h messaging window will be rejected on send. */
export function checkCampaignWindow24h(
  campaign: { id: string },
  audience: CampaignAudienceContact[],
  now: Date = new Date()
): LintFinding[] {
  const outOfWindow = audience.filter((c) => {
    if (!c.last_inbound_at) return true
    return now.getTime() - new Date(c.last_inbound_at).getTime() > MESSAGING_WINDOW_MS
  })
  if (outOfWindow.length === 0) return []

  return [
    {
      ruleId: 'campaign/window-24h',
      scope: 'campaign',
      subjectId: campaign.id,
      severity: 'error',
      title: `${outOfWindow.length} contact(s) seront rejetés par Meta`,
      detail: `Hors de la fenêtre de messagerie de 24h — ils n'ont pas écrit récemment.`,
      fixToolName: 'schedule_campaign',
      fixToolInput: { campaignId: campaign.id, excludeOutOfWindow: true },
    },
  ]
}
