import { createAdminClient } from '../../supabase/admin.ts'
import { getAdapter } from '../../channels/registry.ts'
import { resolveAccessToken } from '../../channels/shared/tokens.ts'
import { TokenExpiredError } from '../../meta/messaging.ts'
import { getTemplate } from './templates.ts'
import type { DetectedLang } from './lang.ts'
import type { ChannelAccountRef, Platform } from '../../channels/types.ts'

/**
 * Abandoned-cart recovery — order_sessions.last_message_at was written on
 * every turn but never read by anything (see components/boutique/
 * abandoned-sessions-list.tsx, a read-only view of the same data). AI
 * conversational recovery converts 15-35% of abandoned carts industry-wide,
 * against 5-15% for email alone — the highest-ROI gap identified when
 * benchmarking against category-leading commerce platforms.
 *
 * Only ONE reminder is sent, within Meta's 24h session-messaging window
 * (see lib/campaigns/service.ts's identical MESSAGING_WINDOW_MS handling —
 * this constraint isn't WhatsApp-specific: every send in this codebase uses
 * messaging_type: 'RESPONSE' with no HUMAN_AGENT/template tag, so it
 * applies to Instagram/Messenger too). Sending a follow-up the next day, as
 * originally envisioned, isn't deliverable without either an approved
 * Meta message tag for this use case (none exists) or WhatsApp template
 * messages (separate, larger effort — not built yet, see the plan). A
 * customer who replies to the reminder resumes through the exact same
 * dispatchInboundMessage → handleEcommerceMessage pipeline as any other
 * message; this module never re-implements slot-filling.
 *
 * WhatsApp is excluded for now: WABA requires an approved template to
 * message outside the 24h window and none exists yet — this sweep only
 * ever reaches Instagram/Messenger accounts (see the plan's Palier A.2 for
 * the WhatsApp follow-up).
 */

// Wide enough to give a real signal of abandonment, narrow enough to leave
// margin before Meta's 24h session window closes on the customer's last
// inbound message (the clock the reminder itself can't reset for a SECOND
// send — hence only one reminder per session).
const REMINDER_MIN_INACTIVITY_MS = 60 * 60 * 1000 // 1h
const REMINDER_MAX_INACTIVITY_MS = 20 * 60 * 60 * 1000 // 20h
// A session that got its one reminder and is now this stale gets marked
// cancelled so it stops showing up as "in progress" anywhere (dashboard,
// abandoned-sessions list) — not a second contact attempt.
const EXPIRE_AFTER_MS = 22 * 60 * 60 * 1000

const CONFIRM_TITLE_BY_LANG: Record<DetectedLang, string> = {
  fr: 'Oui',
  en: 'Yes',
  darija: 'واه',
  ar: 'نعم',
}

interface EligibleAccount {
  id: string
  platform: Exclude<Platform, 'whatsapp'>
  access_token: string
  page_id: string | null
  phone_number_id: string | null
  instagram_business_id: string | null
  is_active: boolean
}

export interface CartRecoveryResult {
  reminded: number
  expired: number
  skipped: number
}

export async function runCartRecoverySweep(): Promise<CartRecoveryResult> {
  const supabase = createAdminClient()
  const now = Date.now()
  let reminded = 0
  let skipped = 0

  const { data: eligibleAccounts } = await supabase
    .from('channel_accounts')
    .select('id, platform, access_token, page_id, phone_number_id, instagram_business_id, is_active')
    .neq('platform', 'whatsapp')
    .eq('is_active', true)

  const accountsById = new Map(((eligibleAccounts ?? []) as EligibleAccount[]).map((a) => [a.id, a]))

  if (accountsById.size > 0) {
    const { data: candidates } = await supabase
      .from('order_sessions')
      .select('*, products(name)')
      .in('status', ['selecting_product', 'gathering_info'])
      .eq('reminder_count', 0)
      .in('channel_account_id', Array.from(accountsById.keys()))
      .lt('last_message_at', new Date(now - REMINDER_MIN_INACTIVITY_MS).toISOString())
      .gt('last_message_at', new Date(now - REMINDER_MAX_INACTIVITY_MS).toISOString())

    for (const session of candidates ?? []) {
      const account = accountsById.get(session.channel_account_id)
      if (!account) {
        skipped += 1
        continue
      }

      try {
        const adapter = getAdapter(account.platform)
        const externalId = account.instagram_business_id || account.page_id || ''
        if (!externalId) {
          skipped += 1
          continue
        }
        const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: await resolveAccessToken(account.access_token) }

        const lang = (session.detected_language as DetectedLang | null) ?? 'fr'
        const t = getTemplate(lang)
        const productName = (session.products as { name?: string } | null)?.name ?? null
        const confirmTitle = CONFIRM_TITLE_BY_LANG[lang] ?? CONFIRM_TITLE_BY_LANG.fr

        const result = await adapter.sendMessage(ref, session.sender_id, t.cartReminder(productName), [{ title: confirmTitle, payload: 'oui' }])

        if (result) {
          await supabase
            .from('order_sessions')
            .update({ reminder_count: 1, reminder_sent_at: new Date().toISOString() })
            .eq('id', session.id)
          reminded += 1
        } else {
          skipped += 1
        }
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          await supabase.from('channel_accounts').update({ is_active: false }).eq('id', account.id)
        } else {
          console.error(`[cart-recovery] Failed to send reminder for session ${session.id}:`, err)
        }
        skipped += 1
      }
    }
  }

  const { data: staleSessions } = await supabase
    .from('order_sessions')
    .select('id')
    .in('status', ['selecting_product', 'gathering_info'])
    .eq('reminder_count', 1)
    .lt('last_message_at', new Date(now - EXPIRE_AFTER_MS).toISOString())

  const staleIds = (staleSessions ?? []).map((s) => s.id as string)
  if (staleIds.length > 0) {
    await supabase.from('order_sessions').update({ status: 'cancelled' }).in('id', staleIds)
  }

  return { reminded, expired: staleIds.length, skipped }
}
