import { createAdminClient } from '../supabase/admin'
import { resolveAccessToken, sealAccessToken } from '../channels/shared/tokens'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * Refresh a long-lived token before it expires.
 * Long-lived tokens are valid for ~60 days but can be refreshed at any time.
 */
export async function refreshLongLivedToken(
  currentToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_INSTAGRAM_APP_ID!,
    client_secret: process.env.META_INSTAGRAM_APP_SECRET!,
    fb_exchange_token: currentToken,
  })

  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`
  )
  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(
      `Token refresh failed: ${data.error?.message ?? 'Unknown error'}`
    )
  }

  return {
    accessToken: data.access_token as string,
    expiresIn: data.expires_in as number,
  }
}

/**
 * Check all instagram_accounts whose tokens expire within the next 7 days,
 * and refresh them proactively.
 * Run this as a cron job (e.g. Vercel Cron, or Supabase Edge Functions).
 */
export async function checkAndRefreshTokens(): Promise<void> {
  const supabase = createAdminClient()

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Find tokens expiring soon or already expired
  const { data: accounts, error } = await supabase
    .from('channel_accounts')
    .select('id, access_token, page_id, token_expires_at')
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .or(
      `token_expires_at.is.null,token_expires_at.lte.${sevenDaysFromNow.toISOString()}`
    )

  if (error) {
    console.error('[checkAndRefreshTokens] DB error:', error)
    return
  }

  if (!accounts || accounts.length === 0) {
    console.log('[checkAndRefreshTokens] No tokens need refreshing.')
    return
  }

  console.log(
    `[checkAndRefreshTokens] Refreshing ${accounts.length} token(s)...`
  )

  for (const account of accounts) {
    try {
      const currentToken = await resolveAccessToken(account.access_token)
      const { accessToken, expiresIn } = await refreshLongLivedToken(currentToken)

      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

      await supabase
        .from('channel_accounts')
        .update({
          access_token: await sealAccessToken(accessToken),
          token_expires_at: expiresAt.toISOString(),
          last_token_refresh: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', account.id)

      console.log(`[checkAndRefreshTokens] ✅ Refreshed token for page ${account.page_id}`)
    } catch (err) {
      console.error(
        `[checkAndRefreshTokens] ❌ Failed for page ${account.page_id}:`,
        err
      )
      // Mark as inactive if refresh fails (token revoked or expired)
      await supabase
        .from('channel_accounts')
        .update({ is_active: false })
        .eq('id', account.id)
    }
  }
}
