import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/contacts?accountId=...&tag=...&q=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  const tagId = request.nextUrl.searchParams.get('tag')
  const q = request.nextUrl.searchParams.get('q')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', accountId).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let query = supabase
    .from('contacts')
    .select('*, contact_tags(tag_id, tags(id, name, color))')
    .eq('channel_account_id', accountId)
    .order('last_inbound_at', { ascending: false, nullsFirst: false })

  if (q) query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`)
  if (tagId) query = query.eq('contact_tags.tag_id', tagId)

  const { data: contacts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(contacts ?? [])
}

// POST /api/contacts — manual creation
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, sender_id, full_name, phone, email } = body
  if (!channel_account_id || !sender_id) {
    return NextResponse.json({ error: 'channel_account_id et sender_id sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ channel_account_id, sender_id, full_name: full_name || null, phone: phone || null, email: email || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(contact, { status: 201 })
}
