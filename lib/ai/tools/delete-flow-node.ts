import type { AiTool } from './types'

interface Input {
  flowId: string
  nodeKey: string
}

export const deleteFlowNodeTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_flow_node',
  description: 'Supprime un nœud et ses arêtes de ce flow. Irréversible.',
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: { flowId: { type: 'string' }, nodeKey: { type: 'string' } },
    required: ['flowId', 'nodeKey'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    // PostgREST parses .or() as a filter expression — strip syntax-significant characters so
    // a model-echoed node_key (ultimately traceable to conversation text) can't inject a clause.
    const safeNodeKey = input.nodeKey.replace(/[,()]/g, '')

    await ctx.supabase
      .from('flow_edges')
      .delete()
      .eq('flow_id', input.flowId)
      .or(`source_node_key.eq.${safeNodeKey},target_node_key.eq.${safeNodeKey}`)

    const { error } = await ctx.supabase.from('flow_nodes').delete().eq('flow_id', input.flowId).eq('node_key', input.nodeKey)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
