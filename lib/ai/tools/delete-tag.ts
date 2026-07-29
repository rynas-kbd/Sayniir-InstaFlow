import type { AiTool } from './types'

interface Input {
  tagId: string
}

export const deleteTagTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_tag',
  description: 'Supprime un tag (le retire de tous les contacts qui le portaient).',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { tagId: { type: 'string' } },
    required: ['tagId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'tags', id: input.tagId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase.from('tags').delete().eq('id', input.tagId).eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
