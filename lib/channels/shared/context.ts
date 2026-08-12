import { createDispatchAdminClient } from '../../supabase/dispatch-admin.ts'
import { isEncrypted, decryptApiKey } from '../../crypto.ts'
import { upsertContact } from '../../contacts/service.ts'
import { channelFromAdapter, type AgentChannel } from '../../agent/messaging.ts'
import { getAdapter } from '../registry.ts'
import { findChannelAccountByExternalId, type ChannelAccountRow } from './lookup.ts'
import type { ChannelAdapter, ChannelAccountRef, NormalizedInboundMessage } from '../types.ts'
import type { BusinessType } from '../../agent/router.ts'

/** Loosely typed — agent_settings has grown many nullable/JSON columns across
 *  migrations and the various handlers only ever read a handful of them. */
export type AgentSettingsRow = Record<string, unknown> & {
  ai_provider?: string | null
  ai_api_key?: string | null
  ai_model?: string | null
  instructions?: string[] | null
  infos_to_collect?: string[] | null
  vertical_config?: unknown
  is_active?: boolean | null
  is_qa_active?: boolean | null
  is_order_taking_active?: boolean | null
  is_availability_check_active?: boolean | null
  flows_enabled?: boolean | null
  default_message_enabled?: boolean | null
  default_message_text?: string | null
  default_message_frequency?: string | null
}

/**
 * Everything dispatchInboundMessage's branches (growth link, postback, text
 * capture, voice turn, text turn) each independently re-fetched before this
 * existed: the channel account, its agent_settings, the owner's business
 * type, and the decrypted AI key — up to 4 round-trips per turn for data
 * that never changes within a single inbound event (audit finding F11).
 * Built once via resolveDispatchContext() at the top of dispatchInboundMessage.
 */
export interface DispatchContext {
  supabase: ReturnType<typeof createDispatchAdminClient>
  account: ChannelAccountRow
  adapter: ChannelAdapter
  ref: ChannelAccountRef
  /** Platform-correct outbound port for agent handlers — see lib/agent/messaging.ts (audit finding F2). */
  channel: AgentChannel
  settings: AgentSettingsRow | null
  /** Already decrypted, or null if unset/decryption failed. */
  aiApiKey: string | null
  businessType: BusinessType
  botPaused: boolean
  /** May be null if contact-limit enforcement blocked creating a new row (see checkContactLimit). */
  contactId: string | null
}

/**
 * `!subscription` (no row at all) means an admin/internal account and is
 * intentionally treated as valid — but a transient DB error was previously
 * indistinguishable from "no row" (both fell through the same `!subscription`
 * branch), which opened the automation up on every blip instead of failing
 * closed (audit finding F13).
 */
export async function isSubscriptionValid(supabase: ReturnType<typeof createDispatchAdminClient>, userId: string): Promise<boolean> {
  const { data: subscription, error } = await supabase.from('subscriptions').select('status, expires_at').eq('user_id', userId).maybeSingle()

  if (error) {
    console.error('[isSubscriptionValid] DB error — failing closed:', error)
    return false
  }
  if (!subscription) return true // admin accounts have no subscription row

  const now = new Date()
  return subscription.status === 'active' && (!subscription.expires_at || new Date(subscription.expires_at) > now)
}

/**
 * Resolves the full dispatch context for an inbound message in one pass, or
 * null when there's nothing to do: no active channel account, or an
 * inactive/expired subscription. Both cases were previously checked
 * separately in every branch of dispatchInboundMessage; folding the check in
 * here means every caller can just do `if (!ctx) return`.
 */
export async function resolveDispatchContext(msg: NormalizedInboundMessage): Promise<DispatchContext | null> {
  const account = await findChannelAccountByExternalId(msg.platform, msg.channelExternalId)
  if (!account) {
    console.warn(`[resolveDispatchContext] No active account found for ${msg.platform}:${msg.channelExternalId}`)
    return null
  }

  const supabase = createDispatchAdminClient()

  if (!(await isSubscriptionValid(supabase, account.user_id))) {
    console.warn(`[resolveDispatchContext] Subscription inactive/expired for account ${account.id} — skipping.`)
    return null
  }

  const adapter = getAdapter(msg.platform)
  const ref: ChannelAccountRef = { id: account.id, externalId: msg.channelExternalId, accessToken: account.access_token }
  const channel = channelFromAdapter(adapter, ref, msg.senderId)

  const [{ data: settings }, { data: ownerProfile }, contactId] = await Promise.all([
    supabase.from('agent_settings').select('*').eq('channel_account_id', account.id).maybeSingle(),
    supabase.from('profiles').select('business_type').eq('id', account.user_id).maybeSingle(),
    // Eagerly ensures a contact row exists for every inbound event (postback
    // and capture-input turns previously never created one) — a strict
    // completeness improvement for the CRM, and needed so botPaused below
    // and every downstream branch (growth link, flows, orders) can share the
    // same id instead of each re-deriving it.
    upsertContact(account.id, msg.senderId),
  ])

  const botPaused = contactId
    ? !!(await supabase.from('contacts').select('bot_paused').eq('id', contactId).maybeSingle()).data?.bot_paused
    : false

  let aiApiKey: string | null = (settings?.ai_api_key as string | null) || null
  if (aiApiKey && isEncrypted(aiApiKey)) {
    try {
      aiApiKey = await decryptApiKey(aiApiKey)
    } catch (err) {
      console.error('[resolveDispatchContext] Failed to decrypt AI API key:', err)
      aiApiKey = null
    }
  }

  const businessType: BusinessType = (ownerProfile?.business_type as BusinessType) ?? 'ecommerce'

  return {
    supabase,
    account,
    adapter,
    ref,
    channel,
    settings: (settings as AgentSettingsRow | null) ?? null,
    aiApiKey,
    businessType,
    botPaused,
    contactId,
  }
}
