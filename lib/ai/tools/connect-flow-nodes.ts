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
    // Unlike add_flow_node (an unconnected node is inert — the engine only
    // follows edges from the trigger), a new edge on an *active* flow is
    // immediately reachable by real inbound messages. connect_flow_nodes
    // itself stays write_reversible (most editing happens in draft), but it
    // must not silently rewire live traffic — same reasoning that made
    // set_flow_status write_live in the first place.
    const { data: flow } = await ctx.supabase.from('flows').select('status').eq('id', input.flowId).single()
    if (flow?.status === 'active') {
      throw new Error(
        "Ce flow est actif et reçoit des messages réels. Mettez-le en pause avec set_flow_status avant d'ajouter cette connexion, ou confirmez explicitement que vous voulez la modifier en direct."
      )
    }

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
