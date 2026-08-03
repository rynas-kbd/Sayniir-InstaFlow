import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// GET /api/team-members?accountId=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', accountId).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(members ?? [])
}

// POST /api/team-members — { channel_account_id, name, email }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { channel_account_id, name, email } = body
  if (!channel_account_id || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'channel_account_id, name et email sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { getUserPlanAndSubscription } = await import('@/lib/plans/restrictions')
  const { plan } = await getUserPlanAndSubscription(user.id)

  if (plan === 'free' || plan === 'pro') {
    return NextResponse.json(
      { error: "Votre plan actuel ne permet pas d'ajouter des membres d'équipe. Veuillez passer à l'abonnement Premium." },
      { status: 403 }
    )
  }

  if (plan === 'premium') {
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', channel_account_id)

    if (count && count >= 10) {
      return NextResponse.json(
        { error: "Limite de 10 membres d'équipe atteinte pour le plan Premium." },
        { status: 403 }
      )
    }
  }

  const { data: member, error } = await supabase
    .from('team_members')
    .insert({ channel_account_id, name: name.trim(), email: email.trim() })
    .select()
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(member, { status: 201 })
}
