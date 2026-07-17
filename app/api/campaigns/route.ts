import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns?accountId=...
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

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(campaigns ?? [])
}

// POST /api/campaigns — { channel_account_id, name, message_template, audience_tag_ids, scheduled_at }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, name, message_template, audience_tag_ids, scheduled_at, response_type, card_title, card_subtitle, card_image_url, card_buttons } = body
  if (!channel_account_id || !name || !message_template) {
    return NextResponse.json({ error: 'channel_account_id, name et message_template sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      channel_account_id,
      name,
      message_template,
      audience_tag_ids: audience_tag_ids ?? [],
      status: scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: scheduled_at ?? null,
      response_type: response_type ?? 'text',
      card_title: card_title ?? null,
      card_subtitle: card_subtitle ?? null,
      card_image_url: card_image_url ?? null,
      card_buttons: card_buttons ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(campaign, { status: 201 })
}
