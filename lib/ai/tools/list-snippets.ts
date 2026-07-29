import type { AiTool } from './types'

interface Output {
  snippets: Array<{ id: string; shortcut: string; text: string }>
}

export const listSnippetsTool: AiTool<Record<string, never>, Output> = {
  name: 'list_snippets',
  description: "Liste les réponses enregistrées (raccourci → texte) de l'inbox.",
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('snippets')
      .select('id, shortcut, text')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { snippets: data ?? [] }
  },
}
