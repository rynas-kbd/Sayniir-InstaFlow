import { instagramAdapter } from './instagram/adapter'
import { messengerAdapter } from './messenger/adapter'
import { whatsappAdapter } from './whatsapp/adapter'
import { isSandbox, captureSandboxMessage } from './sandbox'
import type { ChannelAdapter, Platform } from './types'

const adapters: Partial<Record<Platform, ChannelAdapter>> = {
  instagram: instagramAdapter,
  messenger: messengerAdapter,
  whatsapp: whatsappAdapter,
}

/**
 * Wraps a real adapter so every network-bound outbound call captures into
 * the active sandbox buffer (see lib/channels/sandbox.ts) instead of
 * reaching Meta. Everything else — webhook parsing, signature verification,
 * OAuth — delegates to the real adapter unchanged; none of it runs a
 * network call during dispatchInboundMessage/runFlowsForInbound, so none
 * of it needs stubbing.
 */
function toSandboxAdapter(real: ChannelAdapter): ChannelAdapter {
  return {
    ...real,
    async sendMessage(_ref, _recipientExternalId, text) {
      captureSandboxMessage({ text })
      return { messageId: `sandbox-${Date.now()}` }
    },
    // sendCard/sendButtons/sendTypingIndicator/fetchSenderProfile are only
    // overridden when the real adapter implements them — grafting them onto
    // an adapter that doesn't (e.g. WhatsApp has no sendCard) would make the
    // simulator take a different branch in inbound.ts than production does,
    // which is exactly the "simulation that lies" this feature must avoid.
    ...(real.sendCard && {
      sendCard: async (_ref, _recipientExternalId, title, subtitle, imageUrl, buttons) => {
        captureSandboxMessage({
          text: title,
          card: { title, subtitle, imageUrl },
          buttons: buttons?.map((b) => ({ title: b.title, url: b.url })),
        })
        return { messageId: `sandbox-${Date.now()}` }
      },
    }),
    ...(real.sendButtons && {
      sendButtons: async (_ref, _recipientExternalId, text, buttons) => {
        captureSandboxMessage({
          text,
          buttons: buttons.map((b) => ({ title: b.title, payload: b.payload })),
        })
        return { messageId: `sandbox-${Date.now()}` }
      },
    }),
    ...(real.sendTypingIndicator && {
      sendTypingIndicator: async () => {
        // no-op — nothing to simulate, and it must not reach Meta.
      },
    }),
    ...(real.fetchSenderProfile && {
      fetchSenderProfile: async () => {
        // A fabricated sender has no real Meta profile to fetch — returning
        // a fixed name instead of hitting the network with a fake id.
        return { name: 'Client test', username: 'client_test' }
      },
    }),
  }
}

export function getAdapter(platform: Platform): ChannelAdapter {
  const adapter = adapters[platform]
  if (!adapter) {
    throw new Error(`No channel adapter registered for platform "${platform}"`)
  }
  return isSandbox() ? toSandboxAdapter(adapter) : adapter
}
