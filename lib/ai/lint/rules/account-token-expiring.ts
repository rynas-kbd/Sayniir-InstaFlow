import type { LintFinding } from '../types.ts'

const WARNING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const ERROR_WINDOW_MS = 48 * 60 * 60 * 1000

/** A channel token expiring soon will silently break every flow/rule on that account. */
export function checkAccountTokenExpiring(
  account: { id: string; token_expires_at: string | null },
  activeAutomationCount: number,
  now: Date = new Date()
): LintFinding[] {
  if (!account.token_expires_at) return []
  const msRemaining = new Date(account.token_expires_at).getTime() - now.getTime()
  if (msRemaining > WARNING_WINDOW_MS) return []

  const severity = msRemaining <= ERROR_WINDOW_MS ? 'error' : 'warning'
  const hoursRemaining = Math.max(0, Math.round(msRemaining / (60 * 60 * 1000)))

  return [
    {
      ruleId: 'account/token-expiring',
      scope: 'account',
      subjectId: account.id,
      severity,
      title: `Le token expire dans ${hoursRemaining}h`,
      detail: `${activeAutomationCount} automatisation(s) active(s) tomberont à l'expiration. Reconnexion manuelle requise.`,
    },
  ]
}
