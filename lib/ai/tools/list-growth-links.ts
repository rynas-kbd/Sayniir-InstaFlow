import type { AiTool } from './types'

interface Output {
  links: Array<{ id: string; name: string; code: string; flow_id: string; clicks: number }>
}

export const listGrowthLinksTool: AiTool<Record<string, never>, Output> = {
  name: 'list_growth_links',
  description: 'Liste les liens de croissance (deep links qui déclenchent un flow) du compte.',
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('growth_links')
      .select('id, name, code, flow_id, clicks')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { links: data ?? [] }
  },
}
