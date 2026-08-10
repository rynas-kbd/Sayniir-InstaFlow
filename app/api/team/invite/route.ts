import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/team/invite
 * Invites a real login for a team member — owner-only (inviting stays an
 * account-management action, not covered by the coarse data-access RBAC —
 * see migration 20260831_team_rbac.sql). Sends a Supabase Auth invite email
 * (magic link) via the admin client; the invited user sets their own
 * password at /team/accept-invite. Requires SMTP configured on the
 * Supabase project (dashboard → Authentication → Email) — not something
 * this route can configure itself.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { channel_account_id, name, email, role } = body as { channel_account_id?: string; name?: string; email?: string; role?: string }

  if (!channel_account_id || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'channel_account_id, name et email sont requis' }, { status: 400 })
  }
  if (role && role !== 'admin' && role !== 'agent') {
    return NextResponse.json({ error: 'role doit être "admin" ou "agent"' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channel_account_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!account) return jsonError(403, 'Seul le propriétaire du compte peut inviter des membres')

  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: `${appUrl}/team/accept-invite`,
  })
  if (inviteError || !invited?.user) {
    return jsonError(500, "Échec de l'envoi de l'invitation", inviteError)
  }

  const { data: member, error: upsertError } = await admin
    .from('team_members')
    .upsert(
      {
        channel_account_id,
        name: name.trim(),
        email: email.trim(),
        user_id: invited.user.id,
        role: role ?? 'agent',
        invited_at: new Date().toISOString(),
      },
      { onConflict: 'channel_account_id,email' }
    )
    .select()
    .single()

  if (upsertError) return jsonError(500, "L'invitation a été envoyée mais l'enregistrement a échoué", upsertError)
  return NextResponse.json(member)
}
