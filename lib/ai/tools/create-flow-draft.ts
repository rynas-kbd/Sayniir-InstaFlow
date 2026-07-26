import type { AiTool } from './types'

interface Input {
  name: string
}

export const createFlowDraftTool: AiTool<Input, { flowId: string }> = {
  name: 'create_flow_draft',
  description: 'Crée un nouveau flow en brouillon avec un nœud déclencheur "tout message". Réversible : reste invisible tant qu\'il n\'est pas activé.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string', description: 'Nom du flow' } },
    required: ['name'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const name = input.name.trim().slice(0, 120) || 'Nouveau flow'
    const { data: flow, error } = await ctx.supabase
      .from('flows')
      .insert({ channel_account_id: ctx.channelAccountId, name, status: 'draft', trigger_type: 'any_message' })
      .select('id')
      .single()
    if (error || !flow) throw new Error(error?.message ?? 'Création du flow impossible')

    await ctx.supabase.from('flow_nodes').insert({
      flow_id: flow.id,
      channel_account_id: ctx.channelAccountId,
      node_key: 'trigger',
      type: 'trigger',
      config: {},
      position: { x: 0, y: 0 },
    })

    return { flowId: flow.id }
  },
}
