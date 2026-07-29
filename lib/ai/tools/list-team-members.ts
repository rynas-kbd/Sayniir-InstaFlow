import type { AiTool } from './types'

interface Output {
  members: Array<{ id: string; name: string; email: string }>
}

export const listTeamMembersTool: AiTool<Record<string, never>, Output> = {
  name: 'list_team_members',
  description: "Liste l'annuaire d'équipe du compte (nom + email, pas un accès de connexion partagé).",
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('team_members')
      .select('id, name, email')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { members: data ?? [] }
  },
}
