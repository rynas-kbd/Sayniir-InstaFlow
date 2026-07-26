import type { RuleCardButton } from '@/components/automation/types'

export interface Segment {
  id: string
  name: string
  tag_ids: string[]
  custom_field_key: string | null
  custom_field_value: string | null
  min_days_since_last_inbound: number | null
}

export interface Campaign {
  id: string
  name: string
  message_template: string
  audience_tag_ids: string[]
  segment_id?: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'
  scheduled_at: string | null
  created_at: string
  response_type?: 'text' | 'card'
  card_title?: string | null
  card_subtitle?: string | null
  card_image_url?: string | null
  card_buttons?: RuleCardButton[]
}
