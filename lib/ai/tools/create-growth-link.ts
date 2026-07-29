import { randomBytes } from 'node:crypto'
import type { AiTool } from './types'

interface Input {
  flowId: string
  name: string
}

export const createGrowthLinkTool: AiTool<Input, { linkId: string; code: string }> = {
  name: 'create_growth_link',
  description: "Crée un lien de croissance (deep link) qui déclenche un flow existant à l'ouverture.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { flowId: { type: 'string' }, name: { type: 'string' } },
    required: ['flowId', 'name'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const code = randomBytes(4).toString('hex')
    const { data, error } = await ctx.supabase
      .from('growth_links')
      .insert({ channel_account_id: ctx.channelAccountId, flow_id: input.flowId, name: input.name.trim(), code })
      .select('id, code')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création du lien impossible')
    return { linkId: data.id, code: data.code }
  },
}
