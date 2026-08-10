import type { AiTool } from './types.ts'

interface Input {
  ruleId: string
  name?: string
  triggerType?: string
  triggerKeywords?: string[]
  responseText?: string
  replyMethod?: string
  responseTextDm?: string
}

export const updateAutomationRuleTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_automation_rule',
  description:
    "Modifie une règle d'automatisation existante (nom, déclencheur, réponse). N'active/désactive pas la règle — utilise set_automation_rule_active pour ça.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      ruleId: { type: 'string' },
      name: { type: 'string' },
      triggerType: { type: 'string', enum: ['any_message', 'keyword', 'story_reply', 'any_comment', 'comment_keyword'] },
      triggerKeywords: { type: 'array', items: { type: 'string' } },
      responseText: { type: 'string' },
      replyMethod: { type: 'string', enum: ['comment', 'dm', 'both'] },
      responseTextDm: { type: 'string' },
    },
    required: ['ruleId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'automation_rules', id: input.ruleId }],
  run: async (input, ctx) => {
    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name.trim().slice(0, 120)
    if (input.triggerType !== undefined) patch.trigger_type = input.triggerType
    if (input.triggerKeywords !== undefined) patch.trigger_keywords = input.triggerKeywords
    if (input.responseText !== undefined) patch.response_text = input.responseText.trim()
    if (input.replyMethod !== undefined) patch.reply_method = input.replyMethod
    if (input.responseTextDm !== undefined) patch.response_text_dm = input.responseTextDm.trim()
    if (Object.keys(patch).length === 0) return { updated: false }
    patch.updated_at = new Date().toISOString()

    const { data, error } = await ctx.supabase
      .from('automation_rules')
      .update(patch)
      .eq('id', input.ruleId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    return { updated: (data?.length ?? 0) > 0 }
  },
}
