import type { AiTool } from './types.ts'

interface Input {
  ruleId: string
  isActive: boolean
}

/**
 * write_live: activating an automation rule makes it start auto-replying to
 * real customers immediately (comments or DMs, per its reply_method) — same
 * "goes live on real traffic" bar as set_flow_status. Split out of
 * create_automation_rule/update_automation_rule specifically so that
 * turning a rule on always goes through the confirmation gate in
 * lib/ai/loop.ts, even though creating/editing the rule's text does not.
 */
export const setAutomationRuleActiveTool: AiTool<Input, { isActive: boolean }> = {
  name: 'set_automation_rule_active',
  description:
    "Active ou désactive une règle d'automatisation. Activer une règle la rend immédiatement opérationnelle sur les messages/commentaires entrants réels.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: {
      ruleId: { type: 'string' },
      isActive: { type: 'boolean' },
    },
    required: ['ruleId', 'isActive'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'automation_rules', id: input.ruleId }],
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('automation_rules')
      .update({ is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq('id', input.ruleId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Règle introuvable')
    return { isActive: input.isActive }
  },
}
