import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { syncNow } from '@/lib/boutique/sync'

// POST /api/boutique/sync-now — { sourceAccountId } — one-shot catch-up push, see lib/boutique/sync.ts.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sourceAccountId = body.sourceAccountId
  if (typeof sourceAccountId !== 'string') return jsonError(400, 'sourceAccountId requis')

  // RLS on channel_accounts/agent_settings/products means this whole
  // operation is already scoped to accounts the caller owns — resolveSyncTargets
  // additionally confirms the source account's workspace has sync enabled.
  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', sourceAccountId).eq('user_id', user.id).maybeSingle()
  if (!account) return jsonError(404, 'Compte introuvable')

  try {
    const result = await syncNow(supabase, sourceAccountId)
    return NextResponse.json(result)
  } catch (err) {
    return jsonError(500, 'La synchronisation a échoué', err)
  }
}
