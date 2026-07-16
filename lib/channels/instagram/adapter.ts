import {
  getLoginUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramUserInfo,
  subscribeToWebhooks as igSubscribeToWebhooks,
} from '../../meta/oauth'
import { parseWebhookMessaging, parseWebhookComments, type WebhookPayload } from '../../meta/webhook'
import { sendReply, fetchSenderProfile, sendCardReply, sendButtonMessage } from '../../meta/messaging'
import { refreshLongLivedToken } from '../../meta/token-refresh'
import { verifyWebhookSignature } from '../shared/signature'
import type {
  ChannelAdapter,
  ChannelAccountRef,
  NormalizedInboundMessage,
  NormalizedInboundComment,
  ChannelButton,
} from '../types'

/**
 * Instagram adapter — thin ChannelAdapter wrapper around lib/meta/*.
 * lib/meta/* remains the single source of truth for Instagram Graph API
 * behavior until the Phase 1 webhook cutover, at which point this adapter
 * absorbs that logic directly and lib/meta/* is deleted.
 */
export const instagramAdapter: ChannelAdapter = {
  platform: 'instagram',

  getLoginUrl(state: string): string {
    return getLoginUrl(state)
  },

  async exchangeToken(code: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const shortLivedToken = await exchangeCodeForToken(code)
    return exchangeForLongLivedToken(shortLivedToken)
  },

  async getAccountInfo(accessToken: string) {
    const user = await getInstagramUserInfo(accessToken)
    return {
      externalId: user.id,
      displayName: user.name,
      username: user.username,
      pictureUrl: user.profile_picture_url,
    }
  },

  async subscribeToWebhooks(ref: ChannelAccountRef): Promise<void> {
    await igSubscribeToWebhooks(ref.externalId, ref.accessToken)
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
          platform: 'instagram',
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
        platform: 'instagram',
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

  parseWebhookComments(payload: unknown): NormalizedInboundComment[] {
    const events = parseWebhookComments(payload as WebhookPayload)
    return events.map(({ pageId, comment }) => ({
      platform: 'instagram' as const,
      channelExternalId: pageId,
      commentId: comment.id,
      commenterId: comment.from.id,
      commenterUsername: comment.from.username,
      text: comment.text,
      mediaId: comment.media?.id,
    }))
  },

  async sendMessage(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    text: string,
    quickReplies?: Array<{ title: string; payload: string }>
  ) {
    console.log(`[instagram:sendMessage] externalId=${ref.externalId} recipient=${recipientExternalId}`)
    if (!ref.externalId) {
      console.error('[instagram:sendMessage] ❌ externalId is empty — cannot send message!')
      return null
    }
    const result = await sendReply(ref.externalId, ref.accessToken, recipientExternalId, text, quickReplies)
    return result ? { messageId: result.message_id } : null
  },

  async sendCard(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    title: string,
    subtitle?: string,
    imageUrl?: string,
    buttons?: Array<{ title: string; url: string }>
  ) {
    console.log(`[instagram:sendCard] externalId=${ref.externalId} recipient=${recipientExternalId}`)
    if (!ref.externalId) {
      console.error('[instagram:sendCard] ❌ externalId is empty — cannot send card!')
      return null
    }
    // Instagram does not support generic templates — sendCardReply handles the fallback to text
    const result = await sendCardReply(ref.externalId, ref.accessToken, recipientExternalId, title, subtitle, imageUrl, buttons, false)
    return result ? { messageId: result.message_id } : null
  },


  async sendButtons(ref: ChannelAccountRef, recipientExternalId: string, text: string, buttons: ChannelButton[]) {
    if (!ref.externalId) {
      console.error('[instagram:sendButtons] ❌ externalId is empty — cannot send message!')
      return null
    }
    const result = await sendButtonMessage(ref.externalId, ref.accessToken, recipientExternalId, text, buttons, false)
    return result ? { messageId: result.message_id } : null
  },

  async refreshToken(currentToken: string) {
    return refreshLongLivedToken(currentToken)
  },

  async fetchSenderProfile(senderId: string, accessToken: string) {
    const profile = await fetchSenderProfile(senderId, accessToken)
    if (!profile) return null
    return { name: profile.name, username: profile.username, profilePic: profile.profile_pic }
  },
}
