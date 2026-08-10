import type { AiTool } from './types.ts'

interface Input {
  shortcut: string
  text: string
}

export const createSnippetTool: AiTool<Input, { snippetId: string }> = {
  name: 'create_snippet',
  description: "Crée une réponse enregistrée (raccourci → texte) pour l'inbox.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { shortcut: { type: 'string' }, text: { type: 'string' } },
    required: ['shortcut', 'text'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('snippets')
      .insert({ channel_account_id: ctx.channelAccountId, shortcut: input.shortcut.trim().slice(0, 40), text: input.text.trim() })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création du snippet impossible')
    return { snippetId: data.id }
  },
}
