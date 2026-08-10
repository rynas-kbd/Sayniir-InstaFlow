import type { LintFinding } from '../types.ts'

/** Fires exactly once — right when the very first real contact lands, before the list grows unmanageable without a segment. */
export function checkOnboardingFirstContact(account: { id: string }, contactCount: number, segmentCount: number): LintFinding[] {
  if (contactCount !== 1 || segmentCount > 0) return []

  return [
    {
      ruleId: 'onboarding/first-contact',
      scope: 'contacts',
      subjectId: account.id,
      severity: 'info',
      title: 'Premier contact capturé',
      detail: 'Créez un segment maintenant pour organiser vos contacts avant que la liste ne grossisse.',
      fixToolName: 'create_segment',
      fixToolInput: { name: 'Tous les contacts' },
    },
  ]
}
