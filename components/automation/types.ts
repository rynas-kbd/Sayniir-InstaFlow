export interface ChannelAccountLite {
  id: string
  instagram_username?: string | null
  page_name?: string | null
  phone_number?: string | null
  platform?: 'instagram' | 'whatsapp' | 'messenger'
}

export interface AutomationRule {
  id: string
  channel_account_id: string
  name: string
  trigger_type: string
  trigger_keywords?: string[] | null
  target_post_ids?: string[] | null
  reply_method: 'comment' | 'dm' | 'both'
  response_text: string
  response_text_dm?: string | null
  is_active: boolean
}

export interface RuleFormPayload {
  channel_account_id: string
  name: string
  trigger_type: string
  trigger_keywords: string[] | null
  target_post_ids: string[] | null
  reply_method: 'comment' | 'dm' | 'both'
  response_text: string
  response_text_dm: string
}
