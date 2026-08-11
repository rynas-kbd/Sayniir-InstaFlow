import { createAdminClient } from '../../supabase/admin.ts'
import { resolveAccessToken, resolveWebhookSecret } from './tokens.ts'
import { extractWhatsAppPhoneNumberId } from '../whatsapp/webhook.ts'
import type { Platform } from '../types.ts'

export interface ChannelAccountRow {
  id: string
  user_id: string
  platform: Platform
  page_id: string | null
  phone_number_id: string | null
  access_token: string
  webhook_app_secret: string | null
  is_active: boolean
}

/**
 * Field used as the webhook-supplied external id for each platform:
 * Instagram/Messenger events key off the Page/IG-business id, WhatsApp
 * events key off the Cloud API phone_number_id.
 */
function lookupFieldFor(platform: Platform): 'page_id' | 'phone_number_id' {
  return platform === 'whatsapp' ? 'phone_number_id' : 'page_id'
}

/**
 * Look up an active channel_accounts row by the id Meta sends in the
 * webhook payload, and return it with access_token already decrypted.
 */
export async function findChannelAccountByExternalId(
  platform: Platform,
  externalId: string
): Promise<ChannelAccountRow | null> {
  const supabase = createAdminClient()
  const field = lookupFieldFor(platform)

  const { data, error } = await supabase
    .from('channel_accounts')
    .select('id, user_id, platform, page_id, phone_number_id, access_token, webhook_app_secret, is_active')
    .eq('platform', platform)
    .eq(field, externalId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  return {
    ...data,
    access_token: await resolveAccessToken(data.access_token),
    webhook_app_secret: await resolveWebhookSecret(data.webhook_app_secret),
  }
}

/**
 * Resolves which secret to verify a WhatsApp webhook payload's HMAC
 * signature against — per-account for manually admin-connected accounts
 * (their own Meta app, see 20260901020000_whatsapp_manual_connect.sql),
 * falling back to the shared global META_APP_SECRET for accounts connected
 * via the self-serve Embedded Signup flow (webhook_app_secret NULL) or when
 * the phone_number_id in the payload doesn't match any known account —
 * same behavior as today in both of those cases.
 */
export async function resolveWhatsAppAppSecret(rawBody: string): Promise<string | null> {
  const globalSecret = process.env.META_APP_SECRET ?? null
  const phoneNumberId = extractWhatsAppPhoneNumberId(rawBody)
  if (!phoneNumberId) return globalSecret

  const account = await findChannelAccountByExternalId('whatsapp', phoneNumberId)
  return account?.webhook_app_secret ?? globalSecret
}
