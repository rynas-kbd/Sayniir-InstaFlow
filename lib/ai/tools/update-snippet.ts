import type { AiTool } from './types.ts'

interface Input {
  snippetId: string
  shortcut?: string
  text?: string
}

export const updateSnippetTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_snippet',
  description: "Modifie le raccourci et/ou le texte d'une réponse enregistrée.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { snippetId: { type: 'string' }, shortcut: { type: 'string' }, text: { type: 'string' } },
    required: ['snippetId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'snippets', id: input.snippetId }],
  run: async (input, ctx) => {
    const patch: Record<string, string> = {}
    if (input.shortcut !== undefined) patch.shortcut = input.shortcut.trim().slice(0, 40)
    if (input.text !== undefined) patch.text = input.text.trim()
    if (Object.keys(patch).length === 0) return { updated: false }

    const { data, error } = await ctx.supabase
      .from('snippets')
      .update(patch)
      .eq('id', input.snippetId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    return { updated: (data?.length ?? 0) > 0 }
  },
}
