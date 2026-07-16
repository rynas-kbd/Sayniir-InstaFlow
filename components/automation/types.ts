export interface ChannelAccountLite {
  id: string
  instagram_username?: string | null
  page_name?: string | null
  phone_number?: string | null
  platform?: 'instagram' | 'whatsapp' | 'messenger'
}

export interface RuleCardButton {
  type: 'postback' | 'web_url'
  title: string
  url?: string
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
  response_type?: 'text' | 'card'
  card_title?: string | null
  card_subtitle?: string | null
  card_image_url?: string | null
  card_buttons?: RuleCardButton[]
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
  response_type: 'text' | 'card'
  card_title: string
  card_subtitle: string
  card_image_url: string
  card_buttons: RuleCardButton[]
}
