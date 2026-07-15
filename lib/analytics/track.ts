import { createAdminClient } from '../supabase/admin'

interface RecordEventInput {
  channelAccountId: string
  contactId?: string | null
  type: string
  refId?: string | null
  metadata?: Record<string, unknown>
}

/** Fire-and-forget event log — never throws into the caller. */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('events').insert({
      channel_account_id: input.channelAccountId,
      contact_id: input.contactId ?? null,
      type: input.type,
      ref_id: input.refId ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (err) {
    console.error('[recordEvent] Failed to record event:', err)
  }
}
