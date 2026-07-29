import type { AiTool } from './types'

interface Input {
  linkId: string
}

export const deleteGrowthLinkTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_growth_link',
  description: 'Supprime un lien de croissance.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { linkId: { type: 'string' } },
    required: ['linkId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'growth_links', id: input.linkId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('growth_links')
      .delete()
      .eq('id', input.linkId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
