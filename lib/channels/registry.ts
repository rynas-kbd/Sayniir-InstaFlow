import { instagramAdapter } from './instagram/adapter'
import { messengerAdapter } from './messenger/adapter'
import { whatsappAdapter } from './whatsapp/adapter'
import type { ChannelAdapter, Platform } from './types'

const adapters: Partial<Record<Platform, ChannelAdapter>> = {
  instagram: instagramAdapter,
  messenger: messengerAdapter,
  whatsapp: whatsappAdapter,
}

export function getAdapter(platform: Platform): ChannelAdapter {
  const adapter = adapters[platform]
  if (!adapter) {
    throw new Error(`No channel adapter registered for platform "${platform}"`)
  }
  return adapter
}
