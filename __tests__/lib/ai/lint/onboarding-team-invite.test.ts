import { describe, test, expect } from 'vitest'
import { checkOnboardingTeamInvite } from '../../../../lib/ai/lint/rules/onboarding-team-invite'

describe('checkOnboardingTeamInvite', () => {
  test('flags when team_size implies more than one person but no team_members exist', () => {
    const findings = checkOnboardingTeamInvite({ id: 'a1' }, '2-5', 0)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'onboarding/team-invite', subjectId: 'a1', severity: 'info' })
  })

  test('returns no findings for a solo team', () => {
    expect(checkOnboardingTeamInvite({ id: 'a1' }, 'solo', 0)).toEqual([])
  })

  test('returns no findings when team_size was never answered', () => {
    expect(checkOnboardingTeamInvite({ id: 'a1' }, null, 0)).toEqual([])
  })

  test('returns no findings once at least one team member is referenced', () => {
    expect(checkOnboardingTeamInvite({ id: 'a1' }, '6-20', 2)).toEqual([])
  })
})
