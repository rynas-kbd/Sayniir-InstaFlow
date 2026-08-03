import type { AiTool } from './types'

interface Input {
  query: string
}

interface ContactHit {
  id: string
  full_name: string | null
  username: string | null
  is_subscribed: boolean
}

export const searchContactsTool: AiTool<Input, { contacts: ContactHit[] }> = {
  name: 'search_contacts',
  description: 'Recherche des contacts du compte par nom ou nom d\'utilisateur (max 20 résultats).',
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'Terme de recherche' } },
    required: ['query'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    // PostgREST parses .or() as a filter expression — strip syntax-significant characters so
    // the search term can't break out of the two intended ilike clauses.
    const safe = input.query.replace(/[,()]/g, ' ').trim()
    if (!safe) return { contacts: [] }

    const { data, error } = await ctx.supabase
      .from('contacts')
      .select('id, full_name, username, is_subscribed')
      .eq('channel_account_id', ctx.channelAccountId)
      .or(`full_name.ilike.%${safe}%,username.ilike.%${safe}%`)
      .limit(20)
    if (error) throw new Error(error.message)
    return { contacts: (data ?? []) as ContactHit[] }
  },
}
