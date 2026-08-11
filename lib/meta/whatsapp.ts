/**
 * WhatsApp Cloud API helpers shared by the self-serve Embedded Signup route
 * (app/api/accounts/whatsapp/route.ts) and the admin manual-connect action
 * (app/admin/(dashboard)/clients/[id]/actions.ts::connectWhatsAppManually) —
 * extracted so both entry points validate/subscribe a number identically
 * instead of duplicating these Graph API calls.
 */

const GRAPH_API_VERSION = 'v21.0'

export interface WhatsAppPhoneNumberInfo {
  displayPhoneNumber: string | null
  verifiedName: string | null
}

/**
 * Validates a (phoneNumberId, accessToken) pair against the live Graph API
 * and returns its display info. Throws with Meta's own error message on
 * failure — an invalid/expired token or a phoneNumberId the token doesn't
 * have access to both fail here, before anything is written to the DB.
 */
export async function fetchPhoneNumberInfo(phoneNumberId: string, accessToken: string): Promise<WhatsAppPhoneNumberInfo> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=verified_name,display_phone_number&access_token=${accessToken}`
  )
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? 'Numéro invalide')
  }
  return { displayPhoneNumber: data.display_phone_number ?? null, verifiedName: data.verified_name ?? null }
}

/**
 * Subscribes the app that `accessToken` belongs to, to receive webhooks for
 * this WABA. Best-effort by convention (callers decide how to surface a
 * failure) — Meta returns an error here when the number is already
 * subscribed, which isn't fatal.
 */
export async function subscribeWabaWebhooks(wabaId: string, accessToken: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' }
  }
}
