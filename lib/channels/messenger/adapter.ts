import { parseWebhookMessaging, type WebhookPayload } from '../../meta/webhook'
import { verifyWebhookSignature } from '../shared/signature'
import { getLoginUrl, exchangeCodeForToken, exchangeForLongLivedToken, listPages, subscribeToWebhooks as fbSubscribeToWebhooks } from './oauth'
import type { ChannelAdapter, ChannelAccountRef, NormalizedInboundMessage, NormalizedInboundComment, ChannelButton } from '../types'

const GRAPH_API_VERSION = 'v21.0'

/**
 * Messenger adapter — reuses Instagram's messaging[] webhook shape (both
 * platforms are the Meta "Messenger Platform" under the hood) but has a
 * distinct OAuth flow (Facebook Login for Business, lib/channels/messenger/oauth.ts)
 * and Graph API base (graph.facebook.com instead of graph.instagram.com).
 * No public-comment automation on Messenger — parseWebhookComments is a no-op.
 */
export const messengerAdapter: ChannelAdapter = {
  platform: 'messenger',

  getLoginUrl(state: string): string {
    return getLoginUrl(state)
  },

  async exchangeToken(code: string) {
    const shortLivedToken = await exchangeCodeForToken(code)
    return exchangeForLongLivedToken(shortLivedToken)
  },

  async getAccountInfo(accessToken: string) {
    // OAuth may return several Pages; the first is used for the generic
    // interface, the callback route enumerates all of them via listPages().
    const pages = await listPages(accessToken)
    const first = pages[0]
    if (!first) throw new Error('No Facebook Page returned for this Messenger authorization')
    return {
      externalId: first.id,
      displayName: first.name,
      pictureUrl: first.picture?.data?.url,
    }
  },

  async subscribeToWebhooks(ref: ChannelAccountRef): Promise<void> {
    await fbSubscribeToWebhooks(ref.externalId, ref.accessToken)
  },

  verifyWebhookSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
    return verifyWebhookSignature(rawBody, signature, appSecret)
  },

  parseWebhookMessages(payload: unknown): NormalizedInboundMessage[] {
    const events = parseWebhookMessaging(payload as WebhookPayload)
    const results: NormalizedInboundMessage[] = []

    for (const { pageId, messaging } of events) {
      if (messaging.postback) {
        results.push({
          platform: 'messenger',
          channelExternalId: pageId,
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          messageId: `postback-${messaging.timestamp}-${messaging.sender.id}`,
          postbackPayload: messaging.postback.payload,
          timestamp: messaging.timestamp,
        })
        continue
      }

      if (!messaging.message) continue
      const audioAttachment = messaging.message.attachments?.find((att) => att.type === 'audio')

      results.push({
        platform: 'messenger',
        channelExternalId: pageId,
        senderId: messaging.sender.id,
        recipientId: messaging.recipient.id,
        messageId: messaging.message.mid,
        text: messaging.message.text,
        audioUrl: audioAttachment?.payload?.url,
        timestamp: messaging.timestamp,
      })
    }

    return results
  },

  parseWebhookComments(): NormalizedInboundComment[] {
    return []
  },

  async sendMessage(ref: ChannelAccountRef, recipientExternalId: string, text: string, quickReplies?: Array<{ title: string; payload: string }>) {
    const body: {
      recipient: { id: string }
      message: { text: string; quick_replies?: Array<{ content_type: string; title: string; payload: string }> }
      messaging_type: string
    } = {
      recipient: { id: recipientExternalId },
      message: { text },
      messaging_type: 'RESPONSE',
    }

    if (quickReplies && quickReplies.length > 0) {
      body.message.quick_replies = quickReplies.slice(0, 13).map((qr) => ({
        content_type: 'text',
        title: qr.title.substring(0, 20),
        payload: qr.payload.substring(0, 1000),
      }))
    }

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${ref.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[Messenger sendMessage] Meta API error:', JSON.stringify(data.error))
      return null
    }
    return { messageId: data.message_id as string }
  },

  async sendCard(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    title: string,
    subtitle?: string,
    imageUrl?: string,
    buttons?: Array<{ title: string; url: string }>
  ) {
    const body: any = {
      recipient: { id: recipientExternalId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: title.substring(0, 80),
              }
            ]
          }
        }
      },
      messaging_type: 'RESPONSE',
    }

    const element = body.message.attachment.payload.elements[0]

    if (subtitle) {
      element.subtitle = subtitle.substring(0, 80)
    }
    if (imageUrl) {
      element.image_url = imageUrl
    }
    if (buttons && buttons.length > 0) {
      element.buttons = buttons.slice(0, 3).map((b) => ({
        type: 'web_url',
        url: b.url,
        title: b.title.substring(0, 20)
      }))
    }

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${ref.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[Messenger sendCard] Meta API error:', JSON.stringify(data.error))
      return null
    }
    return { messageId: data.message_id as string }
  },

  async sendButtons(ref: ChannelAccountRef, recipientExternalId: string, text: string, buttons: ChannelButton[]) {
    const body = {
      recipient: { id: recipientExternalId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text.substring(0, 640),
            buttons: buttons.slice(0, 3).map((b) =>
              b.type === 'postback'
                ? { type: 'postback', title: b.title.substring(0, 20), payload: (b.payload ?? '').substring(0, 1000) }
                : { type: 'web_url', title: b.title.substring(0, 20), url: b.url }
            ),
          },
        },
      },
      messaging_type: 'RESPONSE',
    }

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${ref.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[Messenger sendButtons] Meta API error:', JSON.stringify(data.error))
      return null
    }
    return { messageId: data.message_id as string }
  },

  async sendTypingIndicator(ref: ChannelAccountRef, recipientExternalId: string) {
    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${ref.accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { id: recipientExternalId }, sender_action: 'typing_on' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error('[Messenger sendTypingIndicator] Meta API error:', JSON.stringify(data?.error))
      }
    } catch (err) {
      console.error('[Messenger sendTypingIndicator] Request failed:', err)
    }
  },
}
