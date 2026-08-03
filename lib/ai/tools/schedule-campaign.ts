import type { AiTool } from './types'

interface Input {
  campaignId: string
  scheduledAt?: string
}

export const scheduleCampaignTool: AiTool<Input, { scheduled: boolean; scheduledAt: string }> = {
  name: 'schedule_campaign',
  description: "Planifie l'envoi d'une campagne. Les contacts hors fenêtre 24h ou désabonnés sont automatiquement exclus au moment de l'envoi.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: {
      campaignId: { type: 'string' },
      scheduledAt: { type: 'string', description: 'ISO 8601 — immédiat si omis' },
    },
    required: ['campaignId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'campaigns', id: input.campaignId }],
  run: async (input, ctx) => {
    const scheduledAt = input.scheduledAt ?? new Date().toISOString()
    const { data, error } = await ctx.supabase
      .from('campaigns')
      .update({ status: 'scheduled', scheduled_at: scheduledAt })
      .eq('id', input.campaignId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Campagne introuvable')
    return { scheduled: true, scheduledAt }
  },
}
