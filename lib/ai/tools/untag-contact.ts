import type { AiTool } from './types'

interface Input {
  contactId: string
  tagId: string
}

export const untagContactTool: AiTool<Input, { untagged: boolean }> = {
  name: 'untag_contact',
  description: 'Retire un tag d\'un contact.',
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
    const { data, error } = await ctx.supabase
      .from('contact_tags')
      .delete()
      .eq('contact_id', input.contactId)
      .eq('tag_id', input.tagId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('contact_id')
    if (error) throw new Error(error.message)
    return { untagged: (data?.length ?? 0) > 0 }
  },
}
