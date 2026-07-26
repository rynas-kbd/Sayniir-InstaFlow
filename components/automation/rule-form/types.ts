import type { TriggerType, RuleCardButton, ChannelAccountLite } from '../types'

/** All-string/native form state, mirroring the boutique product form's ProductFormState pattern.
 * `trigger_keywords`/`target_post_ids` are real string[] end-to-end — no more join(', ')/split(',')
 * round-tripping through a comma string. */
export interface RuleFormState {
  channel_account_id: string
  name: string
  trigger_type: TriggerType
  trigger_keywords: string[]
  target_post_ids: string[]
  reply_method: 'comment' | 'dm' | 'both'
  response_text: string
  response_text_dm: string
  response_type: 'text' | 'card'
  card_title: string
  card_subtitle: string
  card_image_url: string
  card_buttons: RuleCardButton[]
}

export type RuleFormField = keyof RuleFormState
export type RuleFormErrors = Partial<Record<RuleFormField, string>>

export interface RuleFormApi {
  form: RuleFormState
  errors: RuleFormErrors
  saving: boolean
  isEdit: boolean
  defaultTab: 'dm' | 'comment'
  /** Accounts eligible for this tab — comment automation is Instagram-only. */
  selectableAccounts: ChannelAccountLite[]
  /** Derived: defaultTab === 'dm' || reply_method !== 'comment'. */
  isDmCapable: boolean
  /** Derived: isDmCapable && response_type === 'card'. */
  isCard: boolean
  setField: <K extends RuleFormField>(key: K, value: RuleFormState[K]) => void
  submit: (e: React.FormEvent) => void
}
