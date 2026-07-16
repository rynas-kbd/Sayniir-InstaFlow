import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rules — list rules for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user.id)

  const accountIds = (accounts ?? []).map((a) => a.id)
  if (!accountIds.length) return NextResponse.json([])

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .in('channel_account_id', accountIds)
    .order('created_at', { ascending: false })

  return NextResponse.json(rules ?? [])
}

// POST /api/rules — create a new rule
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    channel_account_id,
    name,
    trigger_type,
    trigger_keywords,
    response_text,
    target_post_ids,
    reply_method,
    response_text_dm,
    response_type,
    card_title,
    card_subtitle,
    card_image_url,
    card_buttons,
  } = body

  if (!channel_account_id || !name || !response_text) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the account belongs to this user
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { data: rule, error } = await supabase
    .from('automation_rules')
    .insert({
      channel_account_id,
      name,
      trigger_type: trigger_type ?? 'any_message',
      trigger_keywords: trigger_keywords ?? null,
      response_text,
      target_post_ids: target_post_ids ?? null,
      reply_method: reply_method ?? 'comment',
      response_text_dm: response_text_dm ?? null,
      response_type: response_type ?? 'text',
      card_title: card_title ?? null,
      card_subtitle: card_subtitle ?? null,
      card_image_url: card_image_url ?? null,
      card_buttons: card_buttons ?? [],
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rule, { status: 201 })
}
