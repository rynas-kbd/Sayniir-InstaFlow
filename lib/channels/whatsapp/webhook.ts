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
