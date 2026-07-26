import type { AiTool } from './types'

interface Input {
  name: string
}

export const createTagTool: AiTool<Input, { tagId: string }> = {
  name: 'create_tag',
  description: 'Crée un nouveau tag pour ce compte.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('tags')
      .insert({ channel_account_id: ctx.channelAccountId, name: input.name.trim().slice(0, 60) })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création du tag impossible')
    return { tagId: data.id }
  },
}
