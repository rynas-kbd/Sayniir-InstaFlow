import type { LintFinding } from '../types'

const FAILURE_RATIO_THRESHOLD = 0.1

/** A completed campaign with a high failure rate is worth a post-mortem look. */
export function checkCampaignFailedSends(
  campaign: { id: string; status: string },
  sentCount: number,
  failedCount: number
): LintFinding[] {
  if (campaign.status !== 'sent' && campaign.status !== 'failed') return []
  const total = sentCount + failedCount
  if (total === 0 || failedCount / total <= FAILURE_RATIO_THRESHOLD) return []

  return [
    {
      ruleId: 'campaign/failed-sends',
      scope: 'campaign',
      subjectId: campaign.id,
      severity: 'warning',
      title: `${Math.round((failedCount / total) * 100)}% des envois ont échoué`,
      detail: `${failedCount} échec(s) sur ${total} tentative(s).`,
    },
  ]
}
