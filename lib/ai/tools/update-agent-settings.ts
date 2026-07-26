import type { AiTool } from './types'

interface Input {
  flowsEnabled?: boolean
  defaultMessageEnabled?: boolean
  isQaActive?: boolean
  isOrderTakingActive?: boolean
  persona?: string
  faqs?: Array<{ question: string; answer: string }>
}

// Explicit whitelist — never accepts an API key or credential field through this tool.
export const updateAgentSettingsTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_agent_settings',
  description:
    "Modifie des réglages globaux du compte : activer les flows, le message par défaut, l'assistant FAQ ou la prise de commande de la Boutique, et le persona/FAQ utilisés par l'IA de la Boutique.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: {
      flowsEnabled: { type: 'boolean' },
      defaultMessageEnabled: { type: 'boolean' },
      isQaActive: { type: 'boolean' },
      isOrderTakingActive: { type: 'boolean' },
      persona: { type: 'string' },
      faqs: {
        type: 'array',
        items: {
          type: 'object',
          properties: { question: { type: 'string' }, answer: { type: 'string' } },
          required: ['question', 'answer'],
          additionalProperties: false,
        },
      },
    },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const patch: Record<string, unknown> = {}
    if (typeof input.flowsEnabled === 'boolean') patch.flows_enabled = input.flowsEnabled
    if (typeof input.defaultMessageEnabled === 'boolean') patch.default_message_enabled = input.defaultMessageEnabled
    if (typeof input.isQaActive === 'boolean') patch.is_qa_active = input.isQaActive
    if (typeof input.isOrderTakingActive === 'boolean') patch.is_order_taking_active = input.isOrderTakingActive

    if (input.persona !== undefined || input.faqs !== undefined) {
      const { data: existing } = await ctx.supabase
        .from('agent_settings')
        .select('vertical_config')
        .eq('channel_account_id', ctx.channelAccountId)
        .maybeSingle()
      const verticalConfig: Record<string, unknown> = { ...(existing?.vertical_config ?? {}) }
      if (input.persona !== undefined) verticalConfig.persona = input.persona
      if (input.faqs !== undefined) verticalConfig.faqs = input.faqs
      patch.vertical_config = verticalConfig
    }

    if (Object.keys(patch).length === 0) return { updated: false }

    const { error } = await ctx.supabase
      .from('agent_settings')
      .upsert({ channel_account_id: ctx.channelAccountId, ...patch }, { onConflict: 'channel_account_id' })
    if (error) throw new Error(error.message)
    return { updated: true }
  },
}
