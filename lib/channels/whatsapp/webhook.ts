/** WhatsApp Cloud API webhook payload shapes — structurally different from Instagram/Messenger's entry[].messaging[]. */

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  audio?: { id: string; mime_type: string }
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp'
  metadata: { display_phone_number: string; phone_number_id: string }
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
  messages?: WhatsAppMessage[]
}

export interface WhatsAppPayload {
  object: string // 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{ field: string; value: WhatsAppValue }>
  }>
}

/**
 * Pulls just the routing key (phone_number_id) out of a raw webhook body,
 * BEFORE signature verification — used to resolve which account's secret to
 * verify against (see lib/channels/shared/lookup.ts::resolveWhatsAppAppSecret).
 * Safe to read pre-verification: phone_number_id is routing metadata, not a
 * secret — a forged value still can't pass HMAC verification without
 * knowing that account's real secret. Defensive by design: any malformed or
 * unexpected shape returns null rather than throwing, so a bad payload
 * falls back to the global secret (same as an unknown account) instead of
 * crashing the request.
 */
export function extractWhatsAppPhoneNumberId(rawBody: string): string | null {
  try {
    const payload = JSON.parse(rawBody) as Partial<WhatsAppPayload>
    if (payload.object !== 'whatsapp_business_account') return null
    return payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null
  } catch {
    return null
  }
}

export function parseWhatsAppMessages(
  payload: WhatsAppPayload
): Array<{ phoneNumberId: string; message: WhatsAppMessage }> {
  const results: Array<{ phoneNumberId: string; message: WhatsAppMessage }> = []
  if (payload.object !== 'whatsapp_business_account') return results

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages' || !change.value.messages) continue
      const phoneNumberId = change.value.metadata.phone_number_id
      for (const message of change.value.messages) {
        results.push({ phoneNumberId, message })
      }
    }
  }
  return results
}
