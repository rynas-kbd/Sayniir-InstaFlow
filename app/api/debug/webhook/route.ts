import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { resolveAccessToken } from '@/lib/channels/shared/tokens'
import { jsonError } from '@/lib/api/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SECURITY: this endpoint previously leaked the first 6 chars of every Meta
 * app secret and a 20-char prefix of decrypted account access tokens to any
 * logged-in user, and performed writes (re-subscribe) from a GET handler
 * (CSRF-triggerable). See docs/SECURITY_AUDIT.md P1-3.
 *
 * Fixed shape: admin-only + non-production, no secret material in any
 * response, and the re-subscribe side effect moved to POST.
 */
async function guard() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Not available in production')
  }
  await requireAdmin()
}

/**
 * GET /api/debug/webhook — read-only diagnostics. No secret/token material
 * in the response, ever — booleans and non-sensitive metadata only.
 */
export async function GET() {
  try {
    await guard()
  } catch (err) {
    return jsonError(403, err instanceof Error ? err.message : 'Forbidden')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_check: {
      META_INSTAGRAM_APP_ID: Boolean(process.env.META_INSTAGRAM_APP_ID),
      META_INSTAGRAM_APP_SECRET: Boolean(process.env.META_INSTAGRAM_APP_SECRET),
      META_MESSENGER_APP_ID: Boolean(process.env.META_MESSENGER_APP_ID),
      META_MESSENGER_APP_SECRET: Boolean(process.env.META_MESSENGER_APP_SECRET),
      META_APP_ID: Boolean(process.env.META_APP_ID),
      META_APP_SECRET: Boolean(process.env.META_APP_SECRET),
      META_WEBHOOK_VERIFY_TOKEN: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      META_MESSENGER_VERIFY_TOKEN: Boolean(process.env.META_MESSENGER_VERIFY_TOKEN),
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    },
  }

  // Scoped by RLS to the caller's own rows — not a platform-wide count.
  const { data: accounts, error: accErr } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_id, instagram_business_id, is_active, access_token')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')

  if (accErr) {
    return jsonError(500, 'Impossible de récupérer les comptes', accErr)
  }

  results.accounts = (accounts ?? []).map((a) => ({
    id: a.id,
    username: a.instagram_username,
    page_id: a.page_id,
    ig_business_id: a.instagram_business_id,
    is_active: a.is_active,
    has_token: Boolean(a.access_token),
  }))

  const { count } = await supabase.from('message_logs').select('*', { count: 'exact', head: true })
  results.total_message_logs = count

  const { count: ruleCount } = await supabase.from('automation_rules').select('*', { count: 'exact', head: true })
  results.total_automation_rules = ruleCount

  return NextResponse.json(results, { status: 200 })
}

/**
 * POST /api/debug/webhook — re-subscribes the caller's active Instagram
 * accounts to webhooks and reports subscription/token status. Split out of
 * GET so it can't be triggered by a simple cross-site `<img>`/navigation.
 * Tokens are sent via the `Authorization` header, never in a URL — Graph API
 * accepts both, and query strings end up in access logs and proxies.
 */
export async function POST() {
  try {
    await guard()
  } catch (err) {
    return jsonError(403, err instanceof Error ? err.message : 'Forbidden')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: accounts, error: accErr } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_id, instagram_business_id, is_active, access_token')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')

  if (accErr) return jsonError(500, 'Impossible de récupérer les comptes', accErr)

  const decryptedAccounts = await Promise.all(
    (accounts ?? []).map(async (a) => ({ ...a, access_token: await resolveAccessToken(a.access_token) }))
  )

  const subscriptionResults: Record<string, unknown>[] = []
  for (const account of decryptedAccounts) {
    if (!account.is_active || !account.access_token) continue

    const igUserId = account.instagram_business_id || account.page_id
    const authHeader = { Authorization: `Bearer ${account.access_token}` }

    try {
      const subRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ subscribed_fields: 'messages' }),
      })
      const subData = await subRes.json()

      const checkRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/subscribed_apps`, {
        headers: authHeader,
      })
      const checkData = await checkRes.json()

      const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username`, { headers: authHeader })
      const meData = await meRes.json()

      subscriptionResults.push({
        username: account.instagram_username,
        ig_user_id: igUserId,
        subscribe_result: subData,
        current_subscriptions: checkData,
        token_valid: !meData.error,
        me_response: meData.error ? meData.error : { id: meData.id, username: meData.username },
      })
    } catch (err) {
      subscriptionResults.push({
        username: account.instagram_username,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ timestamp: new Date().toISOString(), webhook_subscriptions: subscriptionResults })
}
