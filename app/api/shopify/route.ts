import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/shopify?accountId=... — connection status for a channel account.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId requis' }, { status: 400 })

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabase
    .from('shopify_connections')
    .select('shop_domain, connected_at, last_synced_at')
    .eq('channel_account_id', accountId)
    .maybeSingle()

  return NextResponse.json({ connection: data ?? null })
}

// DELETE /api/shopify?accountId=... — disconnect the store.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId requis' }, { status: 400 })

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('shopify_connections').delete().eq('channel_account_id', accountId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ disconnected: true })
}
