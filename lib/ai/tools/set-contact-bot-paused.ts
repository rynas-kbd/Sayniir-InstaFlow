import type { AiTool } from './types.ts'

interface Input {
  contactId: string
  paused: boolean
}

export const setContactBotPausedTool: AiTool<Input, { paused: boolean }> = {
  name: 'set_contact_bot_paused',
  description: "Met en pause ou réactive les réponses automatiques du bot pour ce contact.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: { contactId: { type: 'string' }, paused: { type: 'boolean' } },
    required: ['contactId', 'paused'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'contacts', id: input.contactId }],
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('contacts')
      .update({ bot_paused: input.paused })
      .eq('id', input.contactId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Contact introuvable')
    return { paused: input.paused }
  },
}
