import type { AiTool } from './types'

interface Input {
  memberId: string
}

export const removeTeamMemberTool: AiTool<Input, { removed: boolean }> = {
  name: 'remove_team_member',
  description: "Retire un membre de l'annuaire d'équipe.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { memberId: { type: 'string' } },
    required: ['memberId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'team_members', id: input.memberId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('team_members')
      .delete()
      .eq('id', input.memberId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { removed: true }
  },
}
