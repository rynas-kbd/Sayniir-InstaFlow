import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flows?accountId=...
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

  const { data: flows, error } = await supabase
    .from('flows')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(flows ?? [])
}

// POST /api/flows — { channel_account_id, name, trigger_type, trigger_keywords }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, name, trigger_type, trigger_keywords } = body
  if (!channel_account_id || !name) {
    return NextResponse.json({ error: 'channel_account_id et name sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: flow, error } = await supabase
    .from('flows')
    .insert({
      channel_account_id,
      name,
      trigger_type: trigger_type ?? 'any_message',
      trigger_keywords: trigger_keywords ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed a trigger node so the builder always has a starting point.
  await supabase.from('flow_nodes').insert({
    flow_id: flow.id,
    channel_account_id,
    node_key: 'trigger',
    type: 'trigger',
    config: {},
    position: { x: 0, y: 0 },
  })

  return NextResponse.json(flow, { status: 201 })
}
