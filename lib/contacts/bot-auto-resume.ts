import { createAdminClient } from '../supabase/admin'

/**
 * Auto-resumes the bot for contacts paused longer than `thresholdMinutes` —
 * a safety net on top of the existing manual "Bot actif / Bot en pause"
 * toggle (components/inbox/conversation-thread.tsx): a merchant who pauses
 * the bot to handle a conversation and forgets to re-enable it no longer
 * leaves that customer stuck with a silent bot indefinitely.
 * contacts.bot_paused_at (migration 20260830) is stamped at every place
 * bot_paused is set to true — the manual toggle
 * (app/api/contacts/[id]/route.ts), the 'human' intent handoff
 * (lib/agent/ecommerce/handler.ts), and confidence-based escalation
 * (lib/agent/confidence.ts) — and cleared on resume, manual or automatic.
 */
export async function runBotAutoResume(thresholdMinutes = 30): Promise<{ resumed: number }> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - thresholdMinutes * 60_000).toISOString()

  const { data: stale } = await supabase.from('contacts').select('id').eq('bot_paused', true).lt('bot_paused_at', cutoff)

  const ids = (stale ?? []).map((c) => c.id as string)
  if (ids.length === 0) return { resumed: 0 }

  await supabase.from('contacts').update({ bot_paused: false, bot_paused_at: null }).in('id', ids)
  return { resumed: ids.length }
}
