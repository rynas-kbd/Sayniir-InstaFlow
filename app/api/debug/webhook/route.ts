import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAccessToken } from '@/lib/channels/shared/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/webhook
 * Diagnostic endpoint to check webhook configuration and re-subscribe accounts.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_check: {
      META_APP_ID: process.env.META_APP_ID ? '✅ Set' : '❌ MISSING',
      META_APP_SECRET: process.env.META_APP_SECRET ? `✅ Set (${process.env.META_APP_SECRET!.substring(0, 6)}...)` : '❌ MISSING',
      META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN ? '✅ Set' : '❌ MISSING',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '❌ MISSING',
    },
  }

  // Get accounts
  const { data: accounts, error: accErr } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_id, instagram_business_id, is_active, access_token')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')

  if (accErr) {
    results.accounts_error = accErr.message
    return NextResponse.json(results)
  }

  const decryptedAccounts = await Promise.all(
    (accounts ?? []).map(async (a) => ({ ...a, access_token: await resolveAccessToken(a.access_token) }))
  )

  results.accounts = decryptedAccounts.map((a) => ({
    id: a.id,
    username: a.instagram_username,
    page_id: a.page_id,
    ig_business_id: a.instagram_business_id,
    is_active: a.is_active,
    token_preview: a.access_token ? `${a.access_token.substring(0, 20)}...` : 'NONE',
  }))

  // Try to re-subscribe each active account to webhooks
  const subscriptionResults: Record<string, unknown>[] = []
  for (const account of decryptedAccounts) {
    if (!account.is_active || !account.access_token) continue

    const igUserId = account.instagram_business_id || account.page_id

    try {
      // 1. Re-subscribe to webhooks
      const subRes = await fetch(
        `https://graph.instagram.com/v21.0/${igUserId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscribed_fields: 'messages',
            access_token: account.access_token,
          }),
        }
      )
      const subData = await subRes.json()

      // 2. Check current subscriptions
      const checkRes = await fetch(
        `https://graph.instagram.com/v21.0/${igUserId}/subscribed_apps?access_token=${account.access_token}`
      )
      const checkData = await checkRes.json()

      // 3. Verify token is still valid by fetching /me
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${account.access_token}`
      )
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
        error: String(err),
      })
    }
  }

  results.webhook_subscriptions = subscriptionResults

  // Count message logs
  const { count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true })

  results.total_message_logs = count

  // Count automation rules
  const { count: ruleCount } = await supabase
    .from('automation_rules')
    .select('*', { count: 'exact', head: true })

  results.total_automation_rules = ruleCount

  return NextResponse.json(results, { status: 200 })
}
