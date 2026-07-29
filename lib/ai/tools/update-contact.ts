import type { AiTool } from './types'

interface Input {
  contactId: string
  fullName?: string
  phone?: string
  email?: string
}

export const updateContactTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_contact',
  description: "Modifie les informations d'un contact (nom, téléphone, email).",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      contactId: { type: 'string' },
      fullName: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string' },
    },
    required: ['contactId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'contacts', id: input.contactId }],
  run: async (input, ctx) => {
    const patch: Record<string, string> = {}
    if (input.fullName !== undefined) patch.full_name = input.fullName.trim()
    if (input.phone !== undefined) patch.phone = input.phone.trim()
    if (input.email !== undefined) patch.email = input.email.trim()
    if (Object.keys(patch).length === 0) return { updated: false }

    const { error } = await ctx.supabase
      .from('contacts')
      .update(patch)
      .eq('id', input.contactId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { updated: true }
  },
}
