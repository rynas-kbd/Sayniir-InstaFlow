import type { AiTool } from './types'

interface Input {
  campaignId: string
}

export const deleteCampaignTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_campaign',
  description: 'Supprime une campagne (brouillon ou déjà terminée). Pour arrêter un envoi en cours, utilise cancel_campaign.',
  risk: 'write_reversible',
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
      .delete()
      .eq('id', input.campaignId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
