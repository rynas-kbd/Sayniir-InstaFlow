import { getAdapter } from '../../channels/registry'
import type { ChannelAccountRef, Platform } from '../../channels/types'
import type { AiTool } from './types'

interface Input {
  contactId: string
  text: string
}

/**
 * Mirrors app/api/inbox/send/route.ts's manual-reply flow exactly (resolve
 * the account, resolve the platform-specific externalId, call the adapter,
 * log to message_logs as an outgoing message) — the only new part is
 * resolving contactId → sender_id first, since the tool addresses a
 * contact rather than a raw platform sender id.
 *
 * write_live: this reaches a real customer in real time. lib/ai/loop.ts
 * pauses every write_live call for explicit user confirmation before
 * run() is ever invoked — there is no path to a silent send.
 */
export const sendMessageToContactTool: AiTool<Input, { messageId: string }> = {
  name: 'send_message_to_contact',
  description: 'Envoie un message direct à un contact précis, sur le canal auquel il est rattaché.',
  risk: 'write_live',
  inputSchema: {
    type: 'object',
    properties: {
      contactId: { type: 'string' },
      text: { type: 'string' },
    },
    required: ['contactId', 'text'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'contacts', id: input.contactId }],
  run: async (input, ctx) => {
    const { data: contact } = await ctx.supabase
      .from('contacts')
      .select('id, sender_id')
      .eq('id', input.contactId)
      .eq('channel_account_id', ctx.channelAccountId)
      .single()
    if (!contact) throw new Error('Contact introuvable')

    const { data: account } = await ctx.supabase
      .from('channel_accounts')
      .select('id, access_token, platform, page_id, instagram_business_id, phone_number_id')
      .eq('id', ctx.channelAccountId)
      .single()
    if (!account) throw new Error('Compte introuvable')

    const externalId =
      (account.platform === 'whatsapp' ? account.phone_number_id : account.instagram_business_id || account.page_id) || ''
    if (!externalId) throw new Error('Compte mal configuré (externalId manquant)')

    const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: account.access_token }
    const adapter = getAdapter(account.platform as Platform)

    const text = input.text.trim()
    const result = await adapter.sendMessage(ref, contact.sender_id, text)
    if (!result) throw new Error("Échec de l'envoi")

    await ctx.supabase.from('message_logs').insert({
      channel_account_id: account.id,
      contact_id: contact.id,
      sender_id: contact.sender_id,
      message_id: result.messageId,
      message_text: text,
      direction: 'outgoing',
    })

    return { messageId: result.messageId }
  },
}
