import { NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/team/accept-invite
 * Marks every pending team_members row for the now-authenticated invited
 * user as accepted. Uses the admin client because the caller's own RLS
 * only allows the account OWNER to write team_members rows (see migration
 * 20260831_team_rbac.sql) — an invited member accepting their own
 * membership is exactly the one write a non-owner legitimately needs to
 * make here, so it's done server-side with an explicit `user_id` match
 * rather than widening the owner-only RLS policy for this table.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('team_members')
    .update({ accepted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('accepted_at', null)

  if (error) return jsonError(500, "L'activation a échoué", error)
  return NextResponse.json({ success: true })
}
