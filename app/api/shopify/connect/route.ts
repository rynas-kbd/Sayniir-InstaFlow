import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/shopify/connect
// Body: { accountId, shopDomain, accessToken } — accessToken is a Shopify custom-app Admin API token.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountId, shopDomain, accessToken } = await request.json()
  if (!accountId || !shopDomain || !accessToken) {
    return NextResponse.json({ error: 'accountId, shopDomain et accessToken requis' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')

  const verifyRes = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  })
  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Connexion Shopify refusée. Vérifiez le domaine et le token.' }, { status: 400 })
  }

  const { error } = await supabase.from('shopify_connections').upsert(
    {
      channel_account_id: accountId,
      shop_domain: domain,
      access_token: accessToken,
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'channel_account_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ connected: true, shopDomain: domain })
}
