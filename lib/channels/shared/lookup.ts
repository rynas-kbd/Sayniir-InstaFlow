import { createAdminClient } from '../../supabase/admin'
import { resolveAccessToken } from './tokens'
import type { Platform } from '../types'

export interface ChannelAccountRow {
  id: string
  user_id: string
  platform: Platform
  page_id: string | null
  phone_number_id: string | null
  access_token: string
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
    .select('id, user_id, platform, page_id, phone_number_id, access_token, is_active')
    .eq('platform', platform)
    .eq(field, externalId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  return { ...data, access_token: await resolveAccessToken(data.access_token) }
}
