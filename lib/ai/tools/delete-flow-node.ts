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

    const { error: edgeError } = await ctx.supabase
      .from('flow_edges')
      .delete()
      .eq('flow_id', input.flowId)
      .or(`source_node_key.eq.${safeNodeKey},target_node_key.eq.${safeNodeKey}`)
    // Previously ignored — a failure here left dangling edges pointing at a
    // node that's about to be deleted, silently reported as success below.
    if (edgeError) throw new Error(edgeError.message)

    const { data, error } = await ctx.supabase
      .from('flow_nodes')
      .delete()
      .eq('flow_id', input.flowId)
      .eq('node_key', input.nodeKey)
      .select('node_key')
    if (error) throw new Error(error.message)
    // A hallucinated/already-deleted nodeKey matches zero rows — report that
    // instead of a false success (nodeKey isn't in resourceRefs above, since
    // it isn't a row id; this is the equivalent affected-rows check for it).
    if (!data || data.length === 0) throw new Error('Nœud introuvable dans ce flow')
    return { deleted: true }
  },
}
