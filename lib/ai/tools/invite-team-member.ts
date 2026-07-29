import type { AiTool } from './types'

interface Input {
  name: string
  email: string
}

/**
 * Adds a directory entry only (no login/auth granted — see the migration
 * comment on team_members), hence write_reversible. Still gated by plan:
 * app/api/team-members/route.ts blocks free/pro plans from adding members,
 * and this tool must enforce the exact same restriction rather than
 * bypassing it just because it writes directly via ctx.supabase instead of
 * going through that route.
 */
export const inviteTeamMemberTool: AiTool<Input, { memberId: string }> = {
  name: 'invite_team_member',
  description: "Ajoute un membre à l'annuaire d'équipe (nom + email). Réservé aux plans Premium et supérieurs.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' }, email: { type: 'string' } },
    required: ['name', 'email'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { getUserPlanAndSubscription } = await import('../../plans/restrictions')
    const { plan } = await getUserPlanAndSubscription(ctx.userId)
    if (plan === 'free' || plan === 'pro') {
      throw new Error("Le plan actuel ne permet pas d'ajouter des membres d'équipe. Passez à l'abonnement Premium.")
    }

    const { data, error } = await ctx.supabase
      .from('team_members')
      .insert({ channel_account_id: ctx.channelAccountId, name: input.name.trim(), email: input.email.trim() })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? "Ajout du membre d'équipe impossible")
    return { memberId: data.id }
  },
}
