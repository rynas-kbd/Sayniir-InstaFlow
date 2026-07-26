import type { CardButton } from '@/components/flows/types'

export type AudienceMode = 'all' | 'tags' | 'segment'
export type ScheduleMode = 'now' | 'later'

/** All-string/native form state, mirroring the boutique product form's ProductFormState pattern. */
export interface CampaignFormState {
  name: string
  message: string
  response_type: 'text' | 'card'
  card_title: string
  card_subtitle: string
  card_image_url: string
  card_buttons: CardButton[]
  audience_mode: AudienceMode
  tag_ids: string[]
  segment_id: string
  schedule_mode: ScheduleMode
  /** `datetime-local` input value (not ISO) — converted at payload build time. */
  scheduled_at: string
}

export type CampaignFormField = keyof CampaignFormState
export type CampaignFormErrors = Partial<Record<CampaignFormField, string>>

export interface CampaignFormApi {
  form: CampaignFormState
  errors: CampaignFormErrors
  saving: boolean
  isEdit: boolean
  channelAccountId: string
  setField: <K extends CampaignFormField>(key: K, value: CampaignFormState[K]) => void
  submit: (e: React.FormEvent) => void
}
