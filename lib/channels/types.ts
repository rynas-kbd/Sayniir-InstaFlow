export type Platform = 'instagram' | 'whatsapp' | 'messenger'

export interface ChannelAccountRef {
  id: string
  externalId: string // ig business id / phone_number_id / page id
  accessToken: string
}

export interface NormalizedInboundMessage {
  platform: Platform
  channelExternalId: string // page_id / phone_number_id — looked up against channel_accounts
  senderId: string
  recipientId: string
  messageId: string
  text?: string
  audioUrl?: string
  postbackPayload?: string
  storyEventType?: 'reply' | 'mention'
  referralRef?: string
  timestamp: number
}

export interface ChannelButton {
  type: 'postback' | 'web_url'
  title: string
  url?: string
  payload?: string
}

export interface NormalizedInboundComment {
  platform: Platform
  channelExternalId: string
  commentId: string
  commenterId: string
  commenterUsername?: string
  text: string
  mediaId?: string
}

export interface ChannelAccountInfo {
  externalId: string
  displayName: string
  username?: string
  pictureUrl?: string
}

export interface ChannelAdapter {
  platform: Platform
  getLoginUrl(state: string): string
  exchangeToken(code: string): Promise<{ accessToken: string; expiresIn?: number }>
  getAccountInfo(accessToken: string): Promise<ChannelAccountInfo>
  subscribeToWebhooks(ref: ChannelAccountRef): Promise<void>
  verifyWebhookSignature(rawBody: string, signature: string | null, appSecret: string): boolean
  parseWebhookMessages(payload: unknown): NormalizedInboundMessage[]
  parseWebhookComments(payload: unknown): NormalizedInboundComment[]
  sendMessage(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    text: string,
    quickReplies?: Array<{ title: string; payload: string }>
  ): Promise<{ messageId: string } | null>
  sendCard?(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    title: string,
    subtitle?: string,
    imageUrl?: string,
    buttons?: Array<{ title: string; url: string }>
  ): Promise<{ messageId: string } | null>
  sendButtons?(
    ref: ChannelAccountRef,
    recipientExternalId: string,
    text: string,
    buttons: ChannelButton[]
  ): Promise<{ messageId: string } | null>
  sendTypingIndicator?(ref: ChannelAccountRef, recipientExternalId: string): Promise<void>
  refreshToken?(currentToken: string): Promise<{ accessToken: string; expiresIn: number }>
  fetchSenderProfile?(senderId: string, accessToken: string): Promise<{ name?: string; username?: string; profilePic?: string } | null>
}
