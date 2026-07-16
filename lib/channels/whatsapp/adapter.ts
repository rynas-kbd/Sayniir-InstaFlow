import { verifyWebhookSignature } from '../shared/signature'
import { parseWhatsAppMessages, type WhatsAppPayload } from './webhook'
import type { ChannelAdapter, ChannelAccountRef, NormalizedInboundMessage, NormalizedInboundComment } from '../types'

const GRAPH_API_VERSION = 'v21.0'

/**
 * WhatsApp adapter — no OAuth (per plan: manual connection via a pasted
 * permanent System User token + phone_number_id + WABA ID, see
 * app/api/accounts/whatsapp/route.ts), a structurally different webhook
 * envelope (lib/channels/whatsapp/webhook.ts), and no public-comment concept.
 */
export const whatsappAdapter: ChannelAdapter = {
  platform: 'whatsapp',

  getLoginUrl(): string {
    throw new Error('WhatsApp has no OAuth flow — connect via POST /api/accounts/whatsapp with a manual token')
  },

  async exchangeToken(): Promise<{ accessToken: string; expiresIn?: number }> {
    throw new Error('WhatsApp has no OAuth flow — connect via POST /api/accounts/whatsapp with a manual token')
  },

  async getAccountInfo(): Promise<never> {
    throw new Error('WhatsApp has no OAuth flow — connect via POST /api/accounts/whatsapp with a manual token')
  },

  async subscribeToWebhooks(): Promise<void> {
    // No-op via the generic interface: WhatsApp webhook subscription is done
    // once per WABA (not per phone number) in the manual-connect route,
    // since it needs the WABA ID which ChannelAccountRef does not carry.
  },

  verifyWebhookSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
    return verifyWebhookSignature(rawBody, signature, appSecret)
  },

  parseWebhookMessages(payload: unknown): NormalizedInboundMessage[] {
    const events = parseWhatsAppMessages(payload as WhatsAppPayload)
    const results: NormalizedInboundMessage[] = []

    for (const { phoneNumberId, message } of events) {
      // Audio requires an async media-URL lookup (GET /{media_id}) that a
      // synchronous parser can't perform — voice notes are skipped for
      // WhatsApp for now (text messages are fully supported).
      if (message.type !== 'text' || !message.text) continue

      results.push({
        platform: 'whatsapp',
        channelExternalId: phoneNumberId,
        senderId: message.from,
        recipientId: phoneNumberId,
        messageId: message.id,
        text: message.text.body,
        timestamp: Number(message.timestamp) * 1000,
      })
    }

    return results
  },

  parseWebhookComments(): NormalizedInboundComment[] {
    return []
  },

  async sendMessage(ref: ChannelAccountRef, recipientExternalId: string, text: string, quickReplies?: Array<{ title: string; payload: string }>) {
    const body: Record<string, unknown> = quickReplies?.length
      ? {
          messaging_product: 'whatsapp',
          to: recipientExternalId,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              // WhatsApp interactive buttons are capped at 3, unlike the
              // 13 quick replies Instagram/Messenger allow.
              buttons: quickReplies.slice(0, 3).map((qr, i) => ({
                type: 'reply',
                reply: { id: qr.payload.substring(0, 256) || `option_${i}`, title: qr.title.substring(0, 20) },
              })),
            },
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: recipientExternalId,
          type: 'text',
          text: { body: text },
        }

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${ref.externalId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ref.accessToken}`,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[WhatsApp sendMessage] Cloud API error:', JSON.stringify(data.error))
      return null
    }
    return { messageId: data.messages?.[0]?.id as string }
  },

  async sendCard(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    title: string,
    subtitle?: string,
    imageUrl?: string,
    buttons?: Array<{ title: string; url: string }>
  ) {
    let text = `*${title}*`
    if (subtitle) text += `\n${subtitle}`
    if (imageUrl) text += `\n${imageUrl}`
    if (buttons && buttons.length > 0) {
      text += '\n\n' + buttons.map((b) => `👉 ${b.title}: ${b.url}`).join('\n')
    }
    return this.sendMessage(ref, recipientExternalId, text)
  },
}
