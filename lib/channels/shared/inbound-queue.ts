import { createAdminClient } from '../../supabase/admin'
import type { Platform } from '../types'

/**
 * Deliberately has NO import from ./inbound — dispatchInboundMessage lives
 * there and this module is imported BY inbound.ts (for the webhook route)
 * as well as by the admin recovery route. Keeping these primitives
 * dependency-free avoids a circular import between the two.
 */

/**
 * Idempotency + per-conversation serialization for inbound webhook events.
 *
 * Why this exists: dispatchInboundMessage() used to run fully synchronously
 * inside the webhook POST handler — 1-2 LLM calls plus ~10 DB round-trips —
 * before Meta ever saw a 200 OK. Under the free-tier LLM's latency that
 * routinely exceeded Meta's webhook timeout, which triggers a redelivery of
 * the SAME message. Nothing guarded against processing a redelivered (or
 * merely near-simultaneous) message twice, which is why the audited
 * conversation shows almost every bot reply sent 2-3 times, sometimes in
 * two different languages (two concurrent runs of handleEcommerceMessage
 * each picking a different LLM answer).
 *
 * The webhook route (see createWebhookRoute in inbound.ts) now claims each
 * message's `mid` here BEFORE returning 200, then does the actual dispatch
 * work in `after()` — claiming is a single fast DB round-trip, so Meta
 * still gets its 200 quickly regardless of how slow the LLM call ends up
 * being. try_lock_conversation additionally prevents two claimed messages
 * for the same sender from running dispatchInboundMessage concurrently,
 * which is what let two turns race on the same order_sessions row.
 */

/** Attempts to record a Meta `mid` as seen. Returns false when it was already claimed (redelivery). */
export async function claimInboundEvent(messageId: string, platform: Platform, payload: unknown): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('inbound_events').insert({ message_id: messageId, platform, payload, status: 'processing' })
  if (error?.code === '23505') return false
  if (error) {
    console.error(`[inbound-queue] Failed to claim event ${messageId}:`, error)
    return false
  }
  return true
}

export async function markEventDone(messageId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('inbound_events').update({ status: 'done', processed_at: new Date().toISOString() }).eq('message_id', messageId)
}

export async function markEventFailed(messageId: string, err: unknown): Promise<void> {
  const supabase = createAdminClient()
  const { data: existing } = await supabase.from('inbound_events').select('attempts').eq('message_id', messageId).maybeSingle()
  await supabase
    .from('inbound_events')
    .update({
      status: 'failed',
      attempts: (existing?.attempts ?? 0) + 1,
      last_error: err instanceof Error ? err.message : String(err),
    })
    .eq('message_id', messageId)
}

export async function tryLockConversation(channelKey: string, senderId: string, lockedBy: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('try_lock_conversation', {
    p_channel_account_id: channelKey,
    p_sender_id: senderId,
    p_locked_by: lockedBy,
  })
  if (error) {
    console.error('[inbound-queue] try_lock_conversation failed:', error)
    return false
  }
  return data === true
}

export async function unlockConversation(channelKey: string, senderId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.rpc('unlock_conversation', { p_channel_account_id: channelKey, p_sender_id: senderId })
}

/** Pending events older than this are assumed to have died with their serverless instance (e.g. a hard kill during `after()`) — the recovery sweep re-claims them. */
export async function listStuckEvents(olderThanMs: number, maxAttempts: number): Promise<Array<{ message_id: string; platform: Platform; payload: unknown; attempts: number }>> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - olderThanMs).toISOString()
  const { data } = await supabase
    .from('inbound_events')
    .select('message_id, platform, payload, attempts')
    .in('status', ['processing', 'failed'])
    .lt('created_at', cutoff)
    .lt('attempts', maxAttempts)
    .limit(50)
  return data ?? []
}
