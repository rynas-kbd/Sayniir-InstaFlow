import type { AiTool } from './types'

interface Input {
  ruleId: string
}

export const deleteAutomationRuleTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_automation_rule',
  description: "Supprime une règle d'automatisation.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { ruleId: { type: 'string' } },
    required: ['ruleId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'automation_rules', id: input.ruleId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('automation_rules')
      .delete()
      .eq('id', input.ruleId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
