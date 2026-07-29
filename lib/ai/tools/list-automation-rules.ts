import type { AiTool } from './types'

interface Output {
  rules: Array<{ id: string; name: string; trigger_type: string; trigger_keywords: string[] | null; is_active: boolean }>
}

export const listAutomationRulesTool: AiTool<Record<string, never>, Output> = {
  name: 'list_automation_rules',
  description:
    "Liste les règles d'automatisation classiques (mot-clé → réponse) du compte — distinctes des flows visuels, voir create_automation_rule.",
  risk: 'read',
  inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  run: async (_input, ctx) => {
    const { data } = await ctx.supabase
      .from('automation_rules')
      .select('id, name, trigger_type, trigger_keywords, is_active')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
    return { rules: data ?? [] }
  },
}
