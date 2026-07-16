import { createAdminClient } from '../supabase/admin'
import { getAdapter } from '../channels/registry'
import { resolveAudience } from '../contacts/service'
import { TokenExpiredError } from '../meta/messaging'
import type { ChannelAccountRef, Platform } from '../channels/types'

const WINDOW_MS = 24 * 60 * 60 * 1000

/** Materializes campaign_sends rows for the resolved audience. Idempotent via the (campaign_id, contact_id) unique key. */
export async function enqueueRecipients(campaignId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
  if (!campaign) return 0

  const contactIds = await resolveAudience(campaign.channel_account_id, campaign.audience_tag_ids ?? [])
  if (contactIds.length === 0) return 0

  const rows = contactIds.map((contactId) => ({
    campaign_id: campaignId,
    channel_account_id: campaign.channel_account_id,
    contact_id: contactId,
    status: 'pending' as const,
  }))

  const { error } = await supabase.from('campaign_sends').upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  return contactIds.length
}

/** Cron worker — sends a bounded batch of pending recipients, respecting the 24h messaging window. */
export async function sendBatch(campaignId: string, limit: number): Promise<{ sent: number; skipped: number; failed: number }> {
  const supabase = createAdminClient()
  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
  if (!campaign) return { sent: 0, skipped: 0, failed: 0 }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id, access_token, platform')
    .eq('id', campaign.channel_account_id)
    .single()
  if (!account) return { sent: 0, skipped: 0, failed: 0 }

  const { data: pending } = await supabase
    .from('campaign_sends')
    .select('id, contact_id, contacts(sender_id, is_subscribed, last_inbound_at)')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .limit(limit)

  const adapter = getAdapter(account.platform as Platform)
  const ref: ChannelAccountRef = { id: account.id, externalId: '', accessToken: account.access_token }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of pending ?? []) {
    const contact = row.contacts as unknown as { sender_id: string; is_subscribed: boolean; last_inbound_at: string | null }
    if (!contact) continue

    if (!contact.is_subscribed) {
      await supabase.from('campaign_sends').update({ status: 'skipped_unsubscribed' }).eq('id', row.id)
      skipped += 1
      continue
    }

    const lastInbound = contact.last_inbound_at ? new Date(contact.last_inbound_at).getTime() : 0
    if (Date.now() - lastInbound > WINDOW_MS) {
      await supabase.from('campaign_sends').update({ status: 'skipped_window' }).eq('id', row.id)
      skipped += 1
      continue
    }

    try {
      const result = await adapter.sendMessage(ref, contact.sender_id, campaign.message_template)
      await supabase
        .from('campaign_sends')
        .update({ status: 'sent', sent_message_id: result?.messageId ?? null, sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent += 1
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        await supabase.from('channel_accounts').update({ is_active: false }).eq('id', account.id)
      }
      await supabase
        .from('campaign_sends')
        .update({ status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' })
        .eq('id', row.id)
      failed += 1
    }
  }

  const { count: remaining } = await supabase
    .from('campaign_sends')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (remaining === 0) {
    await supabase.from('campaigns').update({ status: 'sent', completed_at: new Date().toISOString() }).eq('id', campaignId)
  }

  return { sent, skipped, failed }
}
