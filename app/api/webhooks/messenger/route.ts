import { createWebhookRoute } from '@/lib/channels/shared/inbound'

/**
 * Messenger webhook receiver. Register this URL as the Messenger product's
 * callback in the Meta App Dashboard (see plan: prérequis Messenger) with
 * verify token META_MESSENGER_VERIFY_TOKEN.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const { GET, POST } = createWebhookRoute('messenger')
