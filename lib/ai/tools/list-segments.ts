import type { AiTool } from './types'

interface Output {
  segments: Array<{ id: string; name: string; tag_ids: string[] }>
}

export const listSegmentsTool: AiTool<Record<string, never>, Output> = {
  name: 'list_segments',
  description: 'Liste les segments de contacts réutilisables du compte.',
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('segments')
      .select('id, name, tag_ids')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { segments: data ?? [] }
  },
}
