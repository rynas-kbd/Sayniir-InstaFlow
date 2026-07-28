import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/errors'

const BUSINESS_TYPES = new Set(['ecommerce', 'coaching', 'agency', 'generic'])
const PRIMARY_GOALS = new Set(['reply_faster', 'automate_faq', 'convert_comments', 'qualify_leads', 'sell_more'])
const TEAM_SIZES = new Set(['solo', '2-5', '6-20', '20+'])

/**
 * POST /api/onboarding/profile
 * Body: { skip: true } to dismiss the /welcome questionnaire, or
 *       { business_type, primary_goal, team_size } to save it.
 *
 * Strict allowlist by construction — the request body is destructured field
 * by field and validated against the same CHECK-constraint value sets as
 * the database, so nothing (in particular `role` or `id`) beyond these
 * three columns can ever reach the update. This is the application-layer
 * half of the profiles hardening in
 * supabase/migrations/20260817_onboarding.sql; the database-level half
 * (ALTER POLICY ... WITH CHECK pinning role) is what actually stops a
 * forged request that bypassed this route entirely.
 *
 * Runs on the user's own RLS-scoped client, not the admin client — this
 * write must be provably limited to the caller's own row.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError(401, 'Non authentifié')

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  if (body.skip === true) {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_skipped_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) return jsonError(500, 'Une erreur est survenue', error)
    return NextResponse.json({ ok: true })
  }

  const { business_type, primary_goal, team_size } = body as Record<string, unknown>

  if (typeof business_type !== 'string' || !BUSINESS_TYPES.has(business_type)) {
    return NextResponse.json({ error: 'business_type invalide' }, { status: 400 })
  }
  if (primary_goal !== undefined && (typeof primary_goal !== 'string' || !PRIMARY_GOALS.has(primary_goal))) {
    return NextResponse.json({ error: 'primary_goal invalide' }, { status: 400 })
  }
  // 'sell_more' activates the ecommerce sales agent (see activation-checklist.tsx)
  // and only makes sense for a boutique — the UI already gates it on
  // business_type, this is the server-side half of that same rule.
  if (primary_goal === 'sell_more' && business_type !== 'ecommerce') {
    return NextResponse.json({ error: "primary_goal 'sell_more' requiert business_type 'ecommerce'" }, { status: 400 })
  }
  if (team_size !== undefined && (typeof team_size !== 'string' || !TEAM_SIZES.has(team_size))) {
    return NextResponse.json({ error: 'team_size invalide' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      business_type,
      primary_goal: primary_goal ?? null,
      team_size: team_size ?? null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ ok: true })
}
