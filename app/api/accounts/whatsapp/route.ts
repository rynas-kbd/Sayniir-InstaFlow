import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sealAccessToken } from '@/lib/channels/shared/tokens'

const GRAPH_API_VERSION = 'v21.0'

/**
 * POST /api/accounts/whatsapp
 * Manual WhatsApp connection (no OAuth, per plan decision): the user pastes
 * a permanent System User token, the Cloud API phone_number_id and the
 * WABA ID from Meta Business Manager. Verifies the token against the
 * phone_number_id before storing, and subscribes the WABA to the app so
 * webhook delivery starts.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accessToken, phoneNumberId, wabaId } = await request.json()
  if (!accessToken || !phoneNumberId || !wabaId) {
    return NextResponse.json({ error: 'accessToken, phoneNumberId et wabaId sont requis' }, { status: 400 })
  }

  const verifyRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=verified_name,display_phone_number&access_token=${accessToken}`
  )
  const verifyData = await verifyRes.json()
  if (!verifyRes.ok || verifyData.error) {
    return NextResponse.json({ error: verifyData.error?.message ?? 'Token ou phone_number_id invalide' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // channel_accounts' unique constraint is (user_id, platform, page_id), which
  // WhatsApp rows don't use (page_id stays NULL) — dedupe manually instead.
  const { data: existingAccount } = await adminSupabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform', 'whatsapp')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()

  const row = {
    user_id: user.id,
    platform: 'whatsapp' as const,
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    phone_number: verifyData.display_phone_number ?? null,
    page_name: verifyData.verified_name ?? null,
    access_token: await sealAccessToken(accessToken),
    token_type: 'permanent',
    is_active: true,
    connected_at: new Date().toISOString(),
    last_token_refresh: new Date().toISOString(),
  }

  const { error: writeError } = existingAccount
    ? await adminSupabase.from('channel_accounts').update(row).eq('id', existingAccount.id)
    : await adminSupabase.from('channel_accounts').insert(row)

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 })
  }

  try {
    await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (err) {
    console.error('[WhatsApp connect] WABA subscription failed:', err)
  }

  const { data: existingSub } = await adminSupabase.from('subscriptions').select('id').eq('user_id', user.id).single()
  if (!existingSub) {
    await adminSupabase.from('subscriptions').insert({ user_id: user.id, status: 'inactive' })
  }

  return NextResponse.json({ success: true })
}
