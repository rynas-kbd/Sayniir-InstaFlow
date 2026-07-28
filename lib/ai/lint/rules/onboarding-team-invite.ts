import type { LintFinding } from '../types'

/** The Phase 1 questionnaire's team_size answer promised more than one person; nobody has been added to team_members yet. */
export function checkOnboardingTeamInvite(account: { id: string }, teamSize: string | null, teamMemberCount: number): LintFinding[] {
  if (!teamSize || teamSize === 'solo' || teamMemberCount > 0) return []

  return [
    {
      ruleId: 'onboarding/team-invite',
      scope: 'account',
      subjectId: account.id,
      severity: 'info',
      title: 'Invitez votre équipe',
      detail:
        "Vous avez indiqué ne pas être seul, mais aucun membre d'équipe n'est encore référencé — ajoutez-les depuis Paramètres pour répartir le suivi des conversations.",
    },
  ]
}
