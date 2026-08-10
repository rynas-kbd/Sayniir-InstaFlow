import type { LintFinding } from '../types.ts'
import type { CampaignAudienceContact } from './campaign-window-24h.ts'

/** Sending to unsubscribed contacts is both a compliance and a Page-ban risk. */
export function checkCampaignUnsubscribed(
  campaign: { id: string },
  audience: CampaignAudienceContact[]
): LintFinding[] {
  const unsubscribed = audience.filter((c) => c.is_subscribed === false)
  if (unsubscribed.length === 0) return []

  return [
    {
      ruleId: 'campaign/unsubscribed',
      scope: 'campaign',
      subjectId: campaign.id,
      severity: 'error',
      title: `${unsubscribed.length} contact(s) désabonné(s) dans l'audience`,
      detail: 'Ces contacts seront automatiquement exclus de l\'envoi.',
      fixToolName: 'schedule_campaign',
      fixToolInput: { campaignId: campaign.id, excludeUnsubscribed: true },
    },
  ]
}
