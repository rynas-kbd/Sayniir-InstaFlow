const GRAPH_API_VERSION = 'v21.0'

/**
 * Messenger uses Facebook Login for Business — a different OAuth flow from
 * Instagram Business Login (lib/meta/oauth.ts). One authorization can return
 * several Pages, so callers must enumerate them via listPages() rather than
 * assuming a single connected account like Instagram.
 *
 * Uses a login configuration (config_id) rather than a raw `scope` param:
 * the classic scope-only flow grants pages_show_list at the user level but
 * does not attribute any Page as an asset, so me/accounts comes back empty
 * even though the permission shows as granted. config_id makes the Page
 * selection explicit (same pattern as the WhatsApp Embedded Signup button —
 * see META_WHATSAPP_CONFIG_ID / whatsapp-embedded-signup-button.tsx).
 * Create the configuration in the App Dashboard > Facebook Login for
 * Business > Configurations, token type "User", assets "Pages".
 */
export function getLoginUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_MESSENGER_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/messenger/callback`,
    config_id: process.env.META_MESSENGER_CONFIG_ID!,
    response_type: 'code',
    ...(state && { state }),
  })
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_MESSENGER_APP_ID!,
    client_secret: process.env.META_MESSENGER_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/messenger/callback`,
    code,
  })
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`)
  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(`Messenger token exchange failed: ${data.error?.message ?? 'Unknown error'}`)
  }
  return data.access_token as string
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_MESSENGER_APP_ID!,
    client_secret: process.env.META_MESSENGER_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  })
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`)
  const data = await res.json()

  if (!res.ok || data.error) {
    console.warn('[Messenger OAuth] Long-lived exchange failed, using token as-is:', data.error?.message)
    return { accessToken: shortLivedToken, expiresIn: 5184000 }
  }
  return { accessToken: data.access_token as string, expiresIn: data.expires_in as number }
}

export interface MessengerPage {
  id: string
  name: string
  access_token: string
  picture?: { data?: { url?: string } }
}

/** Enumerate the Facebook Pages the authorizing user manages, with page-scoped tokens. */
export async function listPages(userAccessToken: string): Promise<MessengerPage[]> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token,picture&access_token=${userAccessToken}`
  )
  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(`Failed to list Facebook Pages: ${data.error?.message ?? 'Unknown error'}`)
  }
  return (data.data ?? []) as MessengerPage[]
}

/**
 * Diagnostic helper: list permissions actually granted on a user token.
 * Used when listPages() returns zero Pages, to tell apart "scope never
 * granted" from "Page not attributable to this token" (e.g. Business
 * Manager-owned Page) without needing server log access. Best-effort —
 * never throws, since it only feeds an error message.
 */
export async function listGrantedPermissions(userAccessToken: string): Promise<string> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/permissions?access_token=${userAccessToken}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      return `Erreur lors de la lecture des permissions: ${data.error?.message ?? 'Unknown error'}`
    }

    const granted = (data.data ?? [])
      .filter((p: { permission: string; status: string }) => p.status === 'granted')
      .map((p: { permission: string }) => p.permission)

    return granted.length > 0 ? granted.join(', ') : 'aucune'
  } catch (err) {
    return `Erreur lors de la lecture des permissions: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

/** Subscribe a Page to receive Messenger webhook events (messages field). */
export async function subscribeToWebhooks(pageId: string, pageAccessToken: string): Promise<void> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribed_fields: 'messages', access_token: pageAccessToken }),
    })
    const data = await res.json()
    if (!data.success) {
      console.warn(`[Messenger OAuth] Webhook subscription failed for page ${pageId}:`, data)
    }
  } catch (err) {
    console.error(`[Messenger OAuth] Webhook subscription error for page ${pageId}:`, err)
  }
}
