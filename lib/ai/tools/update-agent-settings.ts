import type { AiTool } from './types'

interface Input {
  flowsEnabled?: boolean
  defaultMessageEnabled?: boolean
}

// Explicit whitelist — never accepts an API key or credential field through this tool.
export const updateAgentSettingsTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_agent_settings',
  description: "Modifie des réglages globaux du compte : activer les flows, activer/désactiver le message par défaut.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: {
      flowsEnabled: { type: 'boolean' },
      defaultMessageEnabled: { type: 'boolean' },
    },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const patch: Record<string, boolean> = {}
    if (typeof input.flowsEnabled === 'boolean') patch.flows_enabled = input.flowsEnabled
    if (typeof input.defaultMessageEnabled === 'boolean') patch.default_message_enabled = input.defaultMessageEnabled
    if (Object.keys(patch).length === 0) return { updated: false }

    const { error } = await ctx.supabase
      .from('agent_settings')
      .upsert({ channel_account_id: ctx.channelAccountId, ...patch }, { onConflict: 'channel_account_id' })
    if (error) throw new Error(error.message)
    return { updated: true }
  },
}
