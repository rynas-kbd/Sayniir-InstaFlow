import type { LintFinding } from '../types'

/**
 * Waits until the account has proven its one connected channel actually
 * works (a real inbound message landed) before suggesting a second one —
 * suggesting it any earlier would compete with the activation checklist
 * itself.
 */
export function checkOnboardingSingleChannel(
  account: { id: string },
  connectedChannelCount: number,
  hasReceivedRealMessage: boolean
): LintFinding[] {
  if (connectedChannelCount !== 1 || !hasReceivedRealMessage) return []

  return [
    {
      ruleId: 'onboarding/single-channel',
      scope: 'account',
      subjectId: account.id,
      severity: 'info',
      title: 'Un seul canal connecté',
      detail: 'Connectez un second canal (Instagram, Messenger ou WhatsApp) pour centraliser toutes vos conversations au même endroit.',
    },
  ]
}
