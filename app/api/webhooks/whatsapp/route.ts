import { createWebhookRoute } from '@/lib/channels/shared/inbound'

/**
 * WhatsApp Cloud API webhook receiver. Register this URL as the WhatsApp
 * product's callback in the Meta App Dashboard (see plan: prérequis
 * WhatsApp) with verify token META_WHATSAPP_VERIFY_TOKEN, field "messages".
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const { GET, POST } = createWebhookRoute('whatsapp')
