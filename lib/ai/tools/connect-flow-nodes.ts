import type { AiTool } from './types'

interface Input {
  flowId: string
  sourceNodeKey: string
  targetNodeKey: string
  sourceHandle?: string
}

export const connectFlowNodesTool: AiTool<Input, { connected: boolean }> = {
  name: 'connect_flow_nodes',
  description: 'Relie deux nœuds existants d\'un flow par une arête.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      flowId: { type: 'string' },
      sourceNodeKey: { type: 'string' },
      targetNodeKey: { type: 'string' },
      sourceHandle: { type: 'string', description: "Handle de sortie (défaut 'default', ou 'true'/'false' pour une condition, 'a'/'b' pour un split_test)" },
    },
    required: ['flowId', 'sourceNodeKey', 'targetNodeKey'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase.from('flow_edges').insert({
      flow_id: input.flowId,
      channel_account_id: ctx.channelAccountId,
      source_node_key: input.sourceNodeKey,
      target_node_key: input.targetNodeKey,
      source_handle: input.sourceHandle ?? 'default',
    })
    if (error) throw new Error(error.message)
    return { connected: true }
  },
}
