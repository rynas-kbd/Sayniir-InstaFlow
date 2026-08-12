import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Additional accounts a flow's trigger also matches on, besides its owner
 * (`flows.channel_account_id` — unchanged, still what flow_nodes/flow_edges/
 * flow_runs denormalize and what the builder's RLS keys off). See
 * lib/flows/engine.ts for the runtime OR that reads this table.
 */

// PUT /api/flows/[id]/accounts — replaces the full set of additional target accounts.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const accountIds: unknown[] = Array.isArray(body.accountIds) ? body.accountIds : []

  // Ownership of the flow itself is enforced by RLS on `flows` (the same
  // convention as PATCH/DELETE above). Never target the flow's own owner
  // account here — that one is implicit, not a row in this table.
  const { data: flow, error: flowError } = await supabase.from('flows').select('id, channel_account_id').eq('id', id).maybeSingle()
  if (flowError) return jsonError(500, 'Une erreur est survenue', flowError)
  if (!flow) return jsonError(404, 'Flow introuvable')

  const targetIds = [...new Set(accountIds.filter((v): v is string => typeof v === 'string' && v !== flow.channel_account_id))]

  const { error: deleteError } = await supabase.from('flow_target_accounts').delete().eq('flow_id', id)
  if (deleteError) return jsonError(500, 'Une erreur est survenue', deleteError)

  if (targetIds.length > 0) {
    // RLS on flow_target_accounts (see migration 20260903000000) is the real
    // guard here — it rejects any channel_account_id that doesn't belong to
    // the caller, so a forged id in the body just fails this insert rather
    // than silently attaching the flow to someone else's account.
    const { error: insertError } = await supabase
      .from('flow_target_accounts')
      .insert(targetIds.map((channel_account_id) => ({ flow_id: id, channel_account_id })))
    if (insertError) return jsonError(500, 'Un ou plusieurs comptes sélectionnés sont invalides', insertError)
  }

  return NextResponse.json({ accountIds: targetIds })
}
