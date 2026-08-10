import type { LintScope } from '../lint/types.ts'
import type { AiTool } from './types.ts'

interface Input {
  scope?: LintScope
}

interface Finding {
  rule_id: string
  scope: LintScope
  subject_id: string
  severity: string
  title: string
  detail: string | null
}

export const getLintFindingsTool: AiTool<Input, { findings: Finding[] }> = {
  name: 'get_lint_findings',
  description: 'Liste les suggestions déterministes actives (non ignorées) pour ce compte, filtrable par portée.',
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: { scope: { type: 'string', enum: ['flow', 'campaign', 'account', 'contacts', 'automation'] } },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    let query = ctx.supabase
      .from('ai_insights')
      .select('rule_id, scope, subject_id, severity, title, detail')
      .eq('channel_account_id', ctx.channelAccountId)
      .is('dismissed_at', null)
    if (input.scope) query = query.eq('scope', input.scope)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return { findings: (data ?? []) as Finding[] }
  },
}
