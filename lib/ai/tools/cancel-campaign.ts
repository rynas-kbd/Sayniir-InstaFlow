import type { AiTool } from './types'

interface Input {
  campaignId: string
}

/** Stops a real send (in progress or scheduled) — same real-world-effect family as schedule_campaign, hence write_live. */
export const cancelCampaignTool: AiTool<Input, { cancelled: boolean }> = {
  name: 'cancel_campaign',
  description: "Annule une campagne planifiée ou en cours d'envoi.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: { campaignId: { type: 'string' } },
    required: ['campaignId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'campaigns', id: input.campaignId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', input.campaignId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { cancelled: true }
  },
}
