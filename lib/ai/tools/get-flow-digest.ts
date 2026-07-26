import { resolveAiContext } from '../context/resolve'
import type { AiTool } from './types'

interface Input {
  flowId: string
}

export const getFlowDigestTool: AiTool<Input, { digest: string }> = {
  name: 'get_flow_digest',
  description: "Renvoie le digest compact d'un flow : nœuds, arêtes, reach par nœud, findings de lint.",
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: { flowId: { type: 'string', description: 'UUID du flow' } },
    required: ['flowId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const digest = await resolveAiContext(ctx.supabase, ctx.channelAccountId, { kind: 'flow', flowId: input.flowId })
    return { digest: digest || 'Flow introuvable.' }
  },
}
