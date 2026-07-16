import { createAdminClient } from '../supabase/admin'
import type { Contact, SenderProfile } from './types'

/**
 * Upserts the contact for an inbound message and stamps last_seen_at /
 * last_inbound_at. Called from the hot webhook path — must never throw
 * into the caller, since a CRM write failure must not block the reply.
 */
export async function upsertContact(
  channelAccountId: string,
  senderId: string,
  senderProfile?: SenderProfile | null
): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('contacts')
      .upsert(
        {
          channel_account_id: channelAccountId,
          sender_id: senderId,
          username: senderProfile?.username || null,
          full_name: senderProfile?.name || null,
          profile_pic: senderProfile?.profilePic || null,
          last_seen_at: now,
          last_inbound_at: now,
        },
        { onConflict: 'channel_account_id,sender_id' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[upsertContact] Failed to upsert contact:', error)
      return null
    }
    return data.id
  } catch (err) {
    console.error('[upsertContact] Unexpected error:', err)
    return null
  }
}

export async function getContact(channelAccountId: string, contactId: string): Promise<Contact | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('channel_account_id', channelAccountId)
    .single()
  return data as Contact | null
}

export async function setContactFields(
  channelAccountId: string,
  contactId: string,
  fields: Partial<Pick<Contact, 'full_name' | 'phone' | 'email' | 'is_subscribed' | 'custom_fields'>>
): Promise<Contact | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('contacts')
    .update(fields)
    .eq('id', contactId)
    .eq('channel_account_id', channelAccountId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function addTag(channelAccountId: string, contactId: string, tagId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('contact_tags')
    .upsert({ contact_id: contactId, tag_id: tagId, channel_account_id: channelAccountId }, { onConflict: 'contact_id,tag_id' })
  if (error) throw new Error(error.message)
}

export async function removeTag(contactId: string, tagId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('contact_tags').delete().eq('contact_id', contactId).eq('tag_id', tagId)
  if (error) throw new Error(error.message)
}


