import type { AiTool } from './types'

interface Input {
  snippetId: string
}

export const deleteSnippetTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_snippet',
  description: 'Supprime une réponse enregistrée.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { snippetId: { type: 'string' } },
    required: ['snippetId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'snippets', id: input.snippetId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('snippets')
      .delete()
      .eq('id', input.snippetId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
