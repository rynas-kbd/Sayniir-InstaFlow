export interface Campaign {
  id: string
  name: string
  message_template: string
  audience_tag_ids: string[]
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'
  scheduled_at: string | null
  created_at: string
}
