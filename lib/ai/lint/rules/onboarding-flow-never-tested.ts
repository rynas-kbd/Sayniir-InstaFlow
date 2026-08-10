import type { LintFinding } from '../types.ts'

/**
 * An active automation exists, but the account has never received a single
 * real inbound message — the owner has no evidence it actually works. No
 * fixToolName: the fix is navigating to the dashboard simulator (a UI
 * action), not a backend write, so nothing to attach.
 */
export function checkOnboardingFlowNeverTested(
  account: { id: string },
  hasActiveAutomation: boolean,
  totalIncomingMessages: number
): LintFinding[] {
  if (!hasActiveAutomation || totalIncomingMessages > 0) return []

  return [
    {
      ruleId: 'onboarding/flow-never-tested',
      scope: 'account',
      subjectId: account.id,
      severity: 'info',
      title: "Votre automatisation n'a jamais reçu de message",
      detail:
        'Testez-la en simulant une conversation depuis le tableau de bord pour vérifier qu\'elle répond comme prévu avant votre premier vrai client.',
    },
  ]
}
