import type { LintFinding } from '../types'

const MIN_ACCOUNT_AGE_DAYS = 60
const MAX_ACTIVE_AUTOMATIONS = 3
const MS_PER_DAY = 86_400_000

/**
 * The 60-90 day churn wave the onboarding guide names as the point most
 * products go quiet: an account old enough that first-week enthusiasm has
 * faded, still running fewer than 3 active automations. Deliberately
 * simple — an account-age + automation-count threshold, no reply-rate
 * trend comparison (would need a historical window this cron doesn't have
 * cheaply) — a conservative rule that's always correct beats a precise one
 * that's sometimes wrong (zero-false-positive principle, see
 * docs/AI_NATIVE_DESIGN.md §1.6).
 */
export function checkOnboardingSecondWave(
  account: { id: string; connectedAt: string | null },
  activeAutomationCount: number,
  now: Date = new Date()
): LintFinding[] {
  if (!account.connectedAt) return []

  const ageDays = (now.getTime() - new Date(account.connectedAt).getTime()) / MS_PER_DAY
  if (ageDays < MIN_ACCOUNT_AGE_DAYS || activeAutomationCount >= MAX_ACTIVE_AUTOMATIONS) return []

  return [
    {
      ruleId: 'onboarding/second-wave',
      scope: 'account',
      subjectId: account.id,
      severity: 'warning',
      title: 'Votre automatisation tourne au ralenti',
      detail: `Après ${Math.floor(ageDays)} jours, seulement ${activeAutomationCount} automatisation(s) active(s) — ajoutez un flow depuis un template pour relancer.`,
      fixToolName: 'create_flow_draft',
      fixToolInput: { name: 'Nouvelle automatisation' },
    },
  ]
}
