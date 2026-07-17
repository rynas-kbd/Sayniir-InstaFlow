import { createAdminClient } from '../supabase/admin'
import { getAdapter } from '../channels/registry'
import { resolveAudience, resolveSegment } from '../contacts/service'
import { TokenExpiredError } from '../meta/messaging'
import { renderTemplate } from '../personalization'
import type { ChannelAccountRef, Platform } from '../channels/types'
import type { Contact } from '../contacts/types'



/** Materializes campaign_sends rows for the resolved audience. Idempotent via the (campaign_id, contact_id) unique key. */
export async function enqueueRecipients(campaignId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
  if (!campaign) return 0

  const contactIds = campaign.segment_id
    ? await resolveSegment(campaign.channel_account_id, campaign.segment_id)
    : await resolveAudience(campaign.channel_account_id, campaign.audience_tag_ids ?? [])
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
    .select('id, access_token, platform, page_id, instagram_business_id, phone_number_id')
    .eq('id', campaign.channel_account_id)
    .single()
  if (!account) return { sent: 0, skipped: 0, failed: 0 }

  const externalId = (account.platform === 'whatsapp'
    ? account.phone_number_id
    : account.instagram_business_id || account.page_id) || ''

  const { data: pending } = await supabase
    .from('campaign_sends')
    .select('id, contact_id, contacts(sender_id, is_subscribed, last_inbound_at, full_name, username, phone, email, custom_fields)')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .limit(limit)

  const adapter = getAdapter(account.platform as Platform)
  const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: account.access_token }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of pending ?? []) {
    const contact = row.contacts as unknown as Partial<Contact> & { sender_id: string }
    if (!contact) continue

    try {
      const isCard = campaign.response_type === 'card'
      const cardButtons = ((campaign.card_buttons as Array<{ type?: 'postback' | 'web_url'; title: string; url?: string }>) ?? []).map(
        (b) => ({ ...b, title: renderTemplate(b.title, contact) })
      )
      const personalizedText = renderTemplate(campaign.message_template, contact)

      let result: { messageId: string } | null
      if (isCard && !campaign.card_image_url && cardButtons.length > 0 && adapter.sendButtons) {
        result = await adapter.sendButtons(
          ref,
          contact.sender_id,
          renderTemplate(campaign.card_title || personalizedText, contact),
          cardButtons.map((b) => ({ type: b.type ?? 'web_url', title: b.title, url: b.url }))
        )
      } else if (isCard && adapter.sendCard) {
        result = await adapter.sendCard(
          ref,
          contact.sender_id,
          renderTemplate(campaign.card_title || personalizedText, contact),
          campaign.card_subtitle ? renderTemplate(campaign.card_subtitle, contact) : undefined,
          campaign.card_image_url ?? undefined,
          cardButtons.map((b) => ({ title: b.title, url: b.url ?? '' }))
        )
      } else {
        result = await adapter.sendMessage(ref, contact.sender_id, personalizedText)
      }
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
