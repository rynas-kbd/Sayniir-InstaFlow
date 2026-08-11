import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { randomInt } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sealAccessToken } from '@/lib/channels/shared/tokens'
import { fetchPhoneNumberInfo, subscribeWabaWebhooks } from '@/lib/meta/whatsapp'

const GRAPH_API_VERSION = 'v21.0'

/**
 * POST /api/accounts/whatsapp
 * WhatsApp Embedded Signup callback: the client-side popup
 * (components/accounts/whatsapp-embedded-signup-button.tsx) returns an
 * authorization `code` plus the `phoneNumberId`/`wabaId` captured from the
 * WA_EMBEDDED_SIGNUP postMessage event. This route exchanges the code for a
 * token, registers the phone number on the Cloud API, and stores the account.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, phoneNumberId, wabaId } = await request.json().catch(() => ({}))
  if (!code || !phoneNumberId || !wabaId) {
    return NextResponse.json({ error: 'code, phoneNumberId et wabaId sont requis' }, { status: 400 })
  }

  const appId = process.env.META_WHATSAPP_APP_ID
  const appSecret = process.env.META_WHATSAPP_APP_SECRET
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'META_WHATSAPP_APP_ID / META_WHATSAPP_APP_SECRET non configurés' }, { status: 501 })
  }

  // 1. Exchange the embedded signup code for a business access token.
  const tokenRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    return NextResponse.json({ error: tokenData.error?.message ?? "Échange du code d'autorisation échoué" }, { status: 400 })
  }
  const accessToken = tokenData.access_token as string

  // 2. Register the phone number on the Cloud API (required for a freshly
  // onboarded number — a 2FA PIN is mandatory but not needed again unless
  // the number is migrated to another backend, so it isn't persisted).
  const pin = randomInt(100000, 999999).toString()
  const registerRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
  })
  const registerData = await registerRes.json()
  if (!registerRes.ok || registerData.error) {
    // Meta returns an error if the number is already registered — not fatal,
    // continue (this happens when re-connecting a previously onboarded number).
    console.warn('[WhatsApp connect] Register call warning:', registerData.error?.message)
  }

  // 3. Verify + fetch display info for the number.
  let phoneInfo
  try {
    phoneInfo = await fetchPhoneNumberInfo(phoneNumberId, accessToken)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Numéro invalide' }, { status: 400 })
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

  if (!existingAccount) {
    const { checkChannelLimit } = await import('@/lib/plans/restrictions')
    const { allowed, limit } = await checkChannelLimit(user.id)
    if (!allowed) {
      return NextResponse.json({ error: `Limite de ${limit} canal/canaux atteinte pour votre plan.` }, { status: 403 })
    }
  }

  const row = {
    user_id: user.id,
    platform: 'whatsapp' as const,
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    phone_number: phoneInfo.displayPhoneNumber,
    page_name: phoneInfo.verifiedName,
    access_token: await sealAccessToken(accessToken),
    token_type: 'business',
    is_active: true,
    connected_at: new Date().toISOString(),
    last_token_refresh: new Date().toISOString(),
  }

  const { error: writeError } = existingAccount
    ? await adminSupabase.from('channel_accounts').update(row).eq('id', existingAccount.id)
    : await adminSupabase.from('channel_accounts').insert(row)

  if (writeError) {
    return jsonError(500, 'Une erreur est survenue', writeError)
  }

  const subscribeResult = await subscribeWabaWebhooks(wabaId, accessToken)
  if (!subscribeResult.ok) {
    console.error('[WhatsApp connect] WABA subscription failed:', subscribeResult.error)
  }

  const { data: existingSub } = await adminSupabase.from('subscriptions').select('id').eq('user_id', user.id).single()
  if (!existingSub) {
    await adminSupabase.from('subscriptions').insert({ user_id: user.id, status: 'inactive' })
  }

  return NextResponse.json({ success: true })
}
