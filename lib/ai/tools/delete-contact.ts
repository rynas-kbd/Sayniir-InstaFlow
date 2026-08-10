import type { AiTool } from './types.ts'

interface Input {
  contactId: string
}

/** write_live, not write_reversible: unlike a config row (tag, snippet, rule), this permanently loses a real person's CRM history — the same "irreversible in the real world" bar as send_message_to_contact. */
export const deleteContactTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_contact',
  description: "Supprime définitivement la fiche d'un contact et son historique CRM associé.",
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: { contactId: { type: 'string' } },
    required: ['contactId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'contacts', id: input.contactId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('contacts')
      .delete()
      .eq('id', input.contactId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
