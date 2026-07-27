import { Camera, MessageCircle, Phone, type LucideIcon } from 'lucide-react'
import type { Platform } from './types'

/**
 * Single source of truth for platform display labels and icons. Previously
 * duplicated across components/accounts/account-card.tsx,
 * components/accounts/connect-result-toast.tsx, app/(app)/flows/page.tsx and
 * components/automation/rule-form/rule-form-body.tsx — any new platform had
 * to be added in four places to stay consistent.
 */
export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
}

export const PLATFORM_ICON: Record<Platform, LucideIcon> = {
  instagram: Camera,
  messenger: MessageCircle,
  whatsapp: Phone,
}

/**
 * Human-readable label for a channel account: @username for Instagram,
 * the Page name for Messenger, the phone number for WhatsApp — falling back
 * to the platform label when nothing more specific is available.
 */
export function getAccountLabel(account: {
  platform: Platform
  instagram_username: string | null
  page_name: string | null
  phone_number: string | null
}): string {
  if (account.platform === 'whatsapp') {
    return account.phone_number ?? PLATFORM_LABEL.whatsapp
  }
  if (account.instagram_username) {
    return `@${account.instagram_username}`
  }
  return account.page_name ?? PLATFORM_LABEL[account.platform]
}
