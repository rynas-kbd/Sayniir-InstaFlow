import type { RuleCardButton } from '@/components/automation/types'

export interface Campaign {
  id: string
  name: string
  message_template: string
  audience_tag_ids: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'
  scheduled_at: string | null
  created_at: string
  response_type?: 'text' | 'card'
  card_title?: string | null
  card_subtitle?: string | null
  card_image_url?: string | null
  card_buttons?: RuleCardButton[]
}
