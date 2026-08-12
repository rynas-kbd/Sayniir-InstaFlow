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

export type TriggerType = 'any_message' | 'keyword' | 'story_reply' | 'story_mention' | 'any_comment' | 'comment_keyword'

export interface AutomationRule {
  id: string
  channel_account_id: string
  name: string
  trigger_type: TriggerType
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
  /** Accounts besides `channel_account_id` this rule also matches on — see rule_target_accounts. */
  target_account_ids?: string[]
  /** Owner account's display label — populated by the page so the card can show which account a rule belongs to in 'Tous les canaux' scope. */
  account_name?: string | null
}

export interface RuleFormPayload {
  channel_account_id: string
  name: string
  trigger_type: TriggerType
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
  target_account_ids: string[]
}
