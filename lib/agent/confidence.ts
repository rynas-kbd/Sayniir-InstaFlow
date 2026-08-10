import { createAdminClient } from '../supabase/admin.ts'
import { sendAndReport, type AgentChannel } from './messaging.ts'
import type { AgentOutcome } from './types.ts'

/**
 * Confidence-based escalation to a human — category-leading conversational
 * AI agents (Fin, Sierra, Decagon) score their own confidence per reply and
 * hand off once that confidence stays low across consecutive turns, instead
 * of only ever escalating on an explicit "talk to a human" request (see
 * lib/agent/ecommerce/intent.ts's 'human' intent) or a manual bot_paused.
 * "Escalate early rather than guessing" — two uncertain answers in a row is
 * the signal, not one (a single ambiguous message is normal conversation).
 */
const CONFIDENCE_THRESHOLD = 0.5
const ESCALATION_STREAK = 2

/**
 * Called by each vertical handler right before it would otherwise send its
 * own (possibly uncertain) LLM-generated reply. Returns the escalation
 * AgentOutcome — already sent — when this is the second consecutive
 * low-confidence turn for this sender; the caller must return it directly
 * instead of sending its own reply. Returns null when the caller should
 * proceed normally (confidence was fine, or this is only the first
 * low-confidence turn).
 */
export async function checkConfidenceEscalation(
  accountId: string,
  senderId: string,
  channel: AgentChannel,
  confidence: number | undefined,
  route: string,
  handoffText: string
): Promise<AgentOutcome | null> {
  const supabase = createAdminClient()

  if (confidence === undefined || confidence >= CONFIDENCE_THRESHOLD) {
    // A handler that doesn't report confidence (not yet wired, or a
    // deterministic reply) never penalizes an existing streak — but a
    // confidently-answered turn is real evidence the bot is on track, so
    // it does reset one.
    if (confidence !== undefined) {
      await supabase.from('contacts').update({ low_confidence_streak: 0 }).eq('channel_account_id', accountId).eq('sender_id', senderId)
    }
    return null
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('low_confidence_streak')
    .eq('channel_account_id', accountId)
    .eq('sender_id', senderId)
    .maybeSingle()

  const nextStreak = (contact?.low_confidence_streak ?? 0) + 1

  if (nextStreak < ESCALATION_STREAK) {
    await supabase.from('contacts').update({ low_confidence_streak: nextStreak }).eq('channel_account_id', accountId).eq('sender_id', senderId)
    return null // first low-confidence turn — let the caller send its own answer once
  }

  // Second consecutive low-confidence turn — hand off instead of guessing again.
  await supabase
    .from('contacts')
    .update({ bot_paused: true, bot_paused_at: new Date().toISOString(), low_confidence_streak: 0 })
    .eq('channel_account_id', accountId)
    .eq('sender_id', senderId)
  return sendAndReport(channel, handoffText, `${route}.confidence_escalation`)
}
