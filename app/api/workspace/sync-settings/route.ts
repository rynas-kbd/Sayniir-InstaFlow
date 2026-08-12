import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/workspace/sync-settings — { enabled: boolean }
// Only the workspace OWNER can toggle this — a team member invited to a
// single account has no workspace of their own to flip here.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (typeof body.enabled !== 'boolean') return jsonError(400, 'enabled (boolean) requis')

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update({ boutique_sync_enabled: body.enabled })
    .eq('owner_user_id', user.id)
    .select('id, boutique_sync_enabled')
    .maybeSingle()

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!workspace) return jsonError(404, 'Workspace introuvable')

  return NextResponse.json({ enabled: workspace.boutique_sync_enabled })
}
