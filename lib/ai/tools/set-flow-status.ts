import type { AiTool } from './types.ts'

interface Input {
  flowId: string
  status: 'draft' | 'active' | 'paused'
}

export const setFlowStatusTool: AiTool<Input, { status: string }> = {
  name: 'set_flow_status',
  description: "Change le statut d'un flow (draft/active/paused). Activer un flow le rend immédiatement opérationnel sur les messages entrants.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: { flowId: { type: 'string' }, status: { type: 'string', enum: ['draft', 'active', 'paused'] } },
    required: ['flowId', 'status'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('flows')
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq('id', input.flowId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Flow introuvable')
    return { status: input.status }
  },
}
