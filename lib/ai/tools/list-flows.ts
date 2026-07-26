import type { AiTool } from './types'

interface Output {
  flows: Array<{ id: string; name: string; status: string }>
}

export const listFlowsTool: AiTool<Record<string, never>, Output> = {
  name: 'list_flows',
  description: "Liste les flows du compte avec leur statut (draft, active, paused).",
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('flows')
      .select('id, name, status')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { flows: data ?? [] }
  },
}
