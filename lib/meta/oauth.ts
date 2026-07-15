const GRAPH_API_VERSION = 'v21.0'

/**
 * Required OAuth scopes for Instagram Business API
 */
const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
  'instagram_business_content_publish',
  'instagram_business_manage_insights',
].join(',')

/**
 * Build the Instagram Login authorization URL
 * Uses the Instagram OAuth endpoint for Business accounts
 */
export function getLoginUrl(state?: string): string {
  const params = new URLSearchParams({
    force_reauth: 'true',
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    scope: SCOPES,
    response_type: 'code',
    ...(state && { state }),
  })
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for a short-lived user access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      code,
    }),
  })
  const data = await res.json()

  if (!res.ok || data.error_type || data.error) {
    throw new Error(
      `Token exchange failed: ${data.error_message ?? data.error?.message ?? 'Unknown error'}`
    )
  }

  return data.access_token as string
}

/**
 * Exchange short-lived token for a long-lived token (~60 days).
 * With the Instagram Business API ("Instagram Login"), the initial token
 * returned by /oauth/access_token is already a long-lived token (60 days).
 * If the exchange endpoint rejects the request, we fall back to the original token.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: process.env.META_APP_SECRET!,
    access_token: shortLivedToken,
  })

  try {
    const res = await fetch(
      `https://graph.instagram.com/access_token?${params.toString()}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      console.warn(`[OAuth] Long-lived exchange failed, using token as-is:`, data.error?.message)
      return { accessToken: shortLivedToken, expiresIn: 5184000 } // 60 days in seconds
    }

    return {
      accessToken: data.access_token as string,
      expiresIn: data.expires_in as number,
    }
  } catch (error) {
    console.warn(`[OAuth] Long-lived exchange exception, falling back.`, error)
    return { accessToken: shortLivedToken, expiresIn: 5184000 }
  }
}

export interface InstagramUser {
  id: string
  user_id?: string
  name: string
  username: string
  profile_picture_url?: string
}

/**
 * Get Instagram Business user info using the Instagram Business API
 * Uses graph.instagram.com
 */
export async function getInstagramUserInfo(token: string): Promise<InstagramUser> {
  const res = await fetch(
    `https://graph.instagram.com/me?fields=id,user_id,name,username,profile_picture_url&access_token=${token}`
  )
  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(
      `Failed to fetch Instagram user info: ${data.error?.message ?? 'Unknown error'}`
    )
  }

  return data as InstagramUser
}

/**
 * Subscribe an Instagram Business Account to receive webhook events.
 * Required for Meta to send DM events to our webhook endpoint.
 */
export async function subscribeToWebhooks(
  igUserId: string,
  accessToken: string
): Promise<void> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: 'messages',
          access_token: accessToken,
        }),
      }
    )
    const data = await res.json()
    if (!data.success) {
      console.warn(`[OAuth] Webhook subscription failed for ${igUserId}:`, data)
    } else {
      console.log(`[OAuth] ✅ Webhook subscribed for Instagram account ${igUserId}`)
    }
  } catch (err) {
    console.error(`[OAuth] Webhook subscription error for ${igUserId}:`, err)
  }
}
