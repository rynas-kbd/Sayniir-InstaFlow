import type { AiTool } from './types'

interface Input {
  limit?: number
}

interface Output {
  contacts: Array<{ id: string; full_name: string | null; username: string | null; is_subscribed: boolean }>
}

export const listContactsTool: AiTool<Input, Output> = {
  name: 'list_contacts',
  description: 'Liste les contacts du compte, les plus récents en premier. Pour chercher un contact précis par nom, utilise search_contacts.',
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: { limit: { type: 'number', description: 'Défaut 20, max 100.' } },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)
    const { data } = await ctx.supabase
      .from('contacts')
      .select('id, full_name, username, is_subscribed')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('last_seen_at', { ascending: false })
      .limit(limit)
    return { contacts: data ?? [] }
  },
}
