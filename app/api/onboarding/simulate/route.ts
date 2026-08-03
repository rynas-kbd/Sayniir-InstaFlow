import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/errors'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { runInSandbox } from '@/lib/channels/sandbox'
import { dispatchInboundMessage } from '@/lib/channels/shared/inbound'
import type { NormalizedInboundMessage } from '@/lib/channels/types'
import { checkRateLimit } from '@/lib/api/rate-limit'

const SANDBOX_SENDER_ID = 'onboarding-test-sender'
const MAX_TEXT_LENGTH = 500

/**
 * POST /api/onboarding/simulate
 * Body: { text: string }
 *
 * The onboarding "test it" step (§ Phase 2 activation checklist). Runs the
 * real inbound pipeline — rule matching, flow engine, AI agent, default
 * message — inside a sandbox context (lib/channels/sandbox.ts) so the
 * simulation is truthful (it's the same code path a real DM takes) while
 * leaving zero trace: getAdapter() captures sends instead of calling Meta
 * (registry.ts), and every write to message_logs/contacts/flow_runs/etc.
 * along the way becomes a no-op (lib/supabase/dispatch-admin.ts,
 * lib/contacts/service.ts).
 *
 * Only covers the immediate reply — a flow's delayed steps (resumed by the
 * flow-runs cron) are out of scope for a synchronous request/response.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError(401, 'Non authentifié')

  // Each call runs the full inbound pipeline (flow engine + LLM) — bound the
  // rate so it can't be looped as a free LLM-call generator.
  const rl = checkRateLimit(`onboarding:simulate:${user.id}`, 15, 60_000)
  if (!rl.allowed) return jsonError(429, 'Trop de simulations, réessayez dans une minute')

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Message trop long' }, { status: 400 })
  }

  const { active } = await resolveActiveAccount()
  if (!active) return NextResponse.json({ error: 'Aucun canal connecté' }, { status: 400 })

  // resolveActiveAccount()'s projection doesn't carry phone_number_id
  // (WhatsApp's inbound lookup key, distinct from page_id) — fetch just
  // that column, still through the user's own RLS-scoped client.
  const { data: row } = await supabase
    .from('channel_accounts')
    .select('phone_number_id')
    .eq('id', active.id)
    .single()

  const channelExternalId = active.platform === 'whatsapp' ? row?.phone_number_id : active.page_id
  if (!channelExternalId) {
    return NextResponse.json({ error: 'Compte connecté incomplet — reconnectez-le.' }, { status: 400 })
  }

  const msg: NormalizedInboundMessage = {
    platform: active.platform,
    channelExternalId,
    senderId: SANDBOX_SENDER_ID,
    recipientId: channelExternalId,
    messageId: `sandbox-${user.id}-${Date.now()}`,
    text,
    timestamp: Date.now(),
  }

  const captured = await runInSandbox(() => dispatchInboundMessage(msg))

  if (captured.length === 0) {
    return NextResponse.json({
      messages: [],
      hint: "Aucune automatisation n'a répondu à ce message — vérifiez qu'un flow est actif et que son déclencheur correspond, ou que le message par défaut est activé.",
    })
  }

  return NextResponse.json({ messages: captured })
}
