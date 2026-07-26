import type { AiTool } from './types'

const ALLOWED_TYPES = [
  'send_message',
  'condition',
  'delay',
  'set_tag',
  'remove_tag',
  'ai_reply',
  'jump',
  'capture_input',
  'external_request',
  'split_test',
]

interface Input {
  flowId: string
  nodeKey: string
  type: string
  config?: Record<string, unknown>
}

export const addFlowNodeTool: AiTool<Input, { nodeKey: string }> = {
  name: 'add_flow_node',
  description: "Ajoute un nœud à un flow existant. Le nœud n'est connecté à rien tant que connect_flow_nodes n'est pas appelé.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      flowId: { type: 'string' },
      nodeKey: { type: 'string', description: 'Identifiant unique du nœud dans ce flow' },
      type: { type: 'string', enum: ALLOWED_TYPES },
      config: { type: 'object' },
    },
    required: ['flowId', 'nodeKey', 'type'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase.from('flow_nodes').insert({
      flow_id: input.flowId,
      channel_account_id: ctx.channelAccountId,
      node_key: input.nodeKey,
      type: input.type,
      config: input.config ?? {},
      position: { x: 200, y: 200 },
    })
    if (error) throw new Error(error.message)
    return { nodeKey: input.nodeKey }
  },
}
