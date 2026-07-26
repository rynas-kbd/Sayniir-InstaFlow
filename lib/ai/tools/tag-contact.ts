import type { AiTool } from './types'

interface Input {
  contactId: string
  tagId: string
}

export const tagContactTool: AiTool<Input, { tagged: boolean }> = {
  name: 'tag_contact',
  description: 'Applique un tag existant à un contact.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { contactId: { type: 'string' }, tagId: { type: 'string' } },
    required: ['contactId', 'tagId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [
    { table: 'contacts', id: input.contactId },
    { table: 'tags', id: input.tagId },
  ],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('contact_tags')
      .upsert({ contact_id: input.contactId, tag_id: input.tagId, channel_account_id: ctx.channelAccountId }, { onConflict: 'contact_id,tag_id' })
    if (error) throw new Error(error.message)
    return { tagged: true }
  },
}
