import type { ChannelAdapter, ChannelAccountRef } from '../channels/types.ts'
import type { AgentOutcome } from './types.ts'

/**
 * Vertical-agnostic outbound port for agent handlers (ecommerce Q&A/tunnel,
 * coaching, agency).
 *
 * Why this exists: every agent handler used to call sendReply/sendCardReply
 * from lib/meta/messaging.ts directly, which is hard-wired to
 * graph.instagram.com. On a Messenger or WhatsApp account, every question in
 * the order-taking tunnel, every recap and every confirmation silently
 * failed — sendReply returned null against the wrong Graph API host, the
 * error was swallowed, and the session state advanced anyway. An order got
 * inserted for a customer who never received a single message. Only the
 * classic keyword-rules fallback in inbound.ts used the platform-correct
 * `adapter.sendMessage` (see audit finding F2).
 *
 * `channelFromAdapter` wraps a channel's ChannelAdapter + the resolved
 * recipient into this narrow interface so every agent handler is
 * automatically platform-correct, and picks up quick replies / typing
 * indicators for free where the underlying adapter supports them.
 */
export interface QuickReply {
  title: string
  payload: string
}

export interface AgentChannel {
  sendText(text: string, quickReplies?: QuickReply[]): Promise<{ messageId: string } | null>
  sendTyping(): Promise<void>
}

export function channelFromAdapter(adapter: ChannelAdapter, ref: ChannelAccountRef, recipientExternalId: string): AgentChannel {
  return {
    async sendText(text, quickReplies) {
      return adapter.sendMessage(ref, recipientExternalId, text, quickReplies)
    },

    async sendTyping() {
      if (adapter.sendTypingIndicator) await adapter.sendTypingIndicator(ref, recipientExternalId)
    },
  }
}

/**
 * Shared by every agent handler (ecommerce Q&A/tunnel, coaching, agency, and
 * the classic-rules greeting-reset branch in inbound.ts): sends `text` and
 * turns the result into a typed AgentOutcome instead of each call site
 * separately guessing whether a null/thrown result means the customer got
 * nothing (see audit findings F3/F4).
 */
export async function sendAndReport(
  channel: AgentChannel,
  text: string,
  route: string,
  quickReplies?: QuickReply[],
  confidence?: number
): Promise<AgentOutcome> {
  try {
    const result = await channel.sendText(text, quickReplies)
    if (!result) return { status: 'error', error: new Error('channel.sendText returned null'), route }
    return { status: 'replied', replyText: text, route, ...(confidence !== undefined ? { confidence } : {}) }
  } catch (err) {
    return { status: 'error', error: err, route }
  }
}
