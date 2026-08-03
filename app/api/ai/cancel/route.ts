import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patchPendingToolResult } from '@/lib/ai/pending-tool-result'

export const runtime = 'nodejs'

/**
 * POST /api/ai/cancel — user declines a pending write_live confirmation.
 *
 * Before this route existed, "Annuler" in the Copilot panel was a purely
 * local button: it cleared the confirm card but never told the server, so
 * the ai_tool_calls row stayed pending_confirmation and the assistant
 * message with the unresolved tool_use block sat in ai_messages forever.
 * Every message after that 400'd against the provider (a tool_use block
 * must have a matching tool_result before the next call) — the
 * conversation was permanently bricked. Since lib/ai/loop.ts now always
 * writes a placeholder tool_result when it pauses, this route only needs
 * to patch that placeholder with the real outcome and mark the row denied.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const toolCallId = body?.toolCallId as string | undefined
  if (!toolCallId) return NextResponse.json({ error: 'toolCallId requis' }, { status: 400 })

  const { data: pending } = await supabase
    .from('ai_tool_calls')
    .select('id, tool_use_id, status, result_message_id')
    .eq('id', toolCallId)
    .maybeSingle()

  if (!pending) return NextResponse.json({ error: 'Action introuvable' }, { status: 404 })
  if (pending.status !== 'pending_confirmation') {
    // Already resolved (confirmed, expired, or already cancelled) — idempotent no-op.
    return NextResponse.json({ success: true })
  }

  await supabase
    .from('ai_tool_calls')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', toolCallId)

  await patchPendingToolResult(supabase, pending.result_message_id, pending.tool_use_id, {
    content: "Action refusée par l'utilisateur.",
    isError: true,
  })

  return NextResponse.json({ success: true })
}
