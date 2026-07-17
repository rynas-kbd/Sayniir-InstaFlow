import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/segments?accountId=...
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

  const { data: segments, error } = await supabase
    .from('segments')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(segments ?? [])
}

// POST /api/segments — { channel_account_id, name, tag_ids, custom_field_key, custom_field_value, min_days_since_last_inbound }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, name, tag_ids, custom_field_key, custom_field_value, min_days_since_last_inbound } = body
  if (!channel_account_id || !name) {
    return NextResponse.json({ error: 'channel_account_id et name sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: segment, error } = await supabase
    .from('segments')
    .insert({
      channel_account_id,
      name,
      tag_ids: tag_ids ?? [],
      custom_field_key: custom_field_key || null,
      custom_field_value: custom_field_value || null,
      min_days_since_last_inbound: min_days_since_last_inbound || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(segment, { status: 201 })
}
