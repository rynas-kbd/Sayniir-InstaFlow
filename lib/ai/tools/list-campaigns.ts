import type { AiTool } from './types'

interface Output {
  campaigns: Array<{ id: string; name: string; status: string; scheduled_at: string | null }>
}

export const listCampaignsTool: AiTool<Record<string, never>, Output> = {
  name: 'list_campaigns',
  description: 'Liste les campagnes du compte avec leur statut (draft, scheduled, sending, sent, cancelled, failed).',
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('campaigns')
      .select('id, name, status, scheduled_at')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { campaigns: data ?? [] }
  },
}
