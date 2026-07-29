import type { AiTool } from './types'

interface Output {
  tags: Array<{ id: string; name: string }>
}

export const listTagsTool: AiTool<Record<string, never>, Output> = {
  name: 'list_tags',
  description: 'Liste les tags du compte.',
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('tags')
      .select('id, name')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('name', { ascending: true })
    return { tags: data ?? [] }
  },
}
