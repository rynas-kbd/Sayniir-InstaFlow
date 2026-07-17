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

/**
 * Resolves a saved segment (AND-combined: must have every tag, optional
 * exact custom-field match, optional "no inbound message in N days").
 */
export async function resolveSegment(channelAccountId: string, segmentId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data: segment } = await supabase.from('segments').select('*').eq('id', segmentId).eq('channel_account_id', channelAccountId).single()
  if (!segment) return []

  let query = supabase.from('contacts').select('id, custom_fields, last_inbound_at').eq('channel_account_id', channelAccountId)
  const { data: allContacts } = await query
  let candidates = allContacts ?? []

  if (segment.tag_ids?.length) {
    const { data: taggedRows } = await supabase
      .from('contact_tags')
      .select('contact_id, tag_id')
      .eq('channel_account_id', channelAccountId)
      .in('tag_id', segment.tag_ids)
    const tagsByContact = new Map<string, Set<string>>()
    for (const row of taggedRows ?? []) {
      if (!tagsByContact.has(row.contact_id)) tagsByContact.set(row.contact_id, new Set())
      tagsByContact.get(row.contact_id)!.add(row.tag_id)
    }
    candidates = candidates.filter((c) => {
      const tags = tagsByContact.get(c.id)
      return tags && segment.tag_ids.every((t: string) => tags.has(t))
    })
  }

  if (segment.custom_field_key) {
    candidates = candidates.filter(
      (c) => String((c.custom_fields as Record<string, unknown> | null)?.[segment.custom_field_key] ?? '') === (segment.custom_field_value ?? '')
    )
  }

  if (segment.min_days_since_last_inbound != null) {
    const cutoff = Date.now() - segment.min_days_since_last_inbound * 86400000
    candidates = candidates.filter((c) => !c.last_inbound_at || new Date(c.last_inbound_at).getTime() <= cutoff)
  }

  return candidates.map((c) => c.id)
}

/** Resolves the set of contact ids matching a tag filter (OR across tags), for campaign audiences. */
export async function resolveAudience(channelAccountId: string, tagIds: string[]): Promise<string[]> {
  const supabase = createAdminClient()
  if (!tagIds.length) {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('channel_account_id', channelAccountId)
    return (data ?? []).map((c) => c.id)
  }
  const { data } = await supabase
    .from('contact_tags')
    .select('contact_id')
    .eq('channel_account_id', channelAccountId)
    .in('tag_id', tagIds)
  const ids = new Set((data ?? []).map((row) => row.contact_id as string))
  return Array.from(ids)
}
