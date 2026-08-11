import { describe, test, expect } from 'vitest'
import { extractWhatsAppPhoneNumberId } from '@/lib/channels/whatsapp/webhook'

function payload(phoneNumberId: string) {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: phoneNumberId, display_phone_number: '+1' } } }] }],
  })
}

describe('extractWhatsAppPhoneNumberId', () => {
  test('reads phone_number_id from a valid payload', () => {
    expect(extractWhatsAppPhoneNumberId(payload('123456'))).toBe('123456')
  })

  test('returns null when object is not whatsapp_business_account', () => {
    expect(extractWhatsAppPhoneNumberId(JSON.stringify({ object: 'page', entry: [] }))).toBeNull()
  })

  test('returns null on unparsable JSON instead of throwing', () => {
    expect(extractWhatsAppPhoneNumberId('not json')).toBeNull()
  })

  test('returns null when entry/changes/value/metadata is missing', () => {
    expect(extractWhatsAppPhoneNumberId(JSON.stringify({ object: 'whatsapp_business_account', entry: [] }))).toBeNull()
    expect(extractWhatsAppPhoneNumberId(JSON.stringify({ object: 'whatsapp_business_account' }))).toBeNull()
  })
})
