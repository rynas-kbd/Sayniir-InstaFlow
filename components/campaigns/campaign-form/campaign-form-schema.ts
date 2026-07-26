import type { Campaign } from '../types'
import type { CampaignFormErrors, CampaignFormState } from './types'

export const FIELD_IDS: Record<keyof CampaignFormState, string> = {
  name: 'c-name',
  message: 'c-message',
  response_type: 'c-response-type',
  card_title: 'c-card-title',
  card_subtitle: 'c-card-subtitle',
  card_image_url: 'c-card-image',
  card_buttons: 'c-card-buttons',
  audience_mode: 'c-audience-mode',
  tag_ids: 'c-tag-ids',
  segment_id: 'c-segment',
  schedule_mode: 'c-schedule-mode',
  scheduled_at: 'c-scheduled-at',
}

/** ISO timestamp -> `datetime-local` input value (local time, no seconds/zone). */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function emptyForm(campaign?: Campaign): CampaignFormState {
  return {
    name: campaign?.name ?? '',
    message: campaign?.message_template ?? '',
    response_type: campaign?.response_type ?? 'text',
    card_title: campaign?.card_title ?? '',
    card_subtitle: campaign?.card_subtitle ?? '',
    card_image_url: campaign?.card_image_url ?? '',
    card_buttons: campaign?.card_buttons ?? [],
    audience_mode: campaign?.segment_id ? 'segment' : campaign?.audience_tag_ids?.length ? 'tags' : 'all',
    tag_ids: campaign?.audience_tag_ids ?? [],
    segment_id: campaign?.segment_id ?? '',
    schedule_mode: campaign?.scheduled_at ? 'later' : 'now',
    scheduled_at: campaign?.scheduled_at ? toDatetimeLocalValue(campaign.scheduled_at) : '',
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Kind-aware like the product form's validator — only inspects fields the current
 * response_type/schedule_mode actually renders, so switching away from card/later never leaves a
 * stale error blocking submission on an invisible field. */
export function validateCampaignForm(f: CampaignFormState): CampaignFormErrors {
  const errors: CampaignFormErrors = {}

  if (!f.name.trim()) errors.name = 'Le nom est obligatoire'
  else if (f.name.trim().length > 120) errors.name = '120 caractères maximum'

  if (!f.message.trim()) errors.message = 'Le message est obligatoire'

  if (f.response_type === 'card') {
    if (!f.card_title.trim()) errors.card_title = 'Le titre de la carte est obligatoire'
    if (f.card_image_url.trim() !== '' && !isHttpUrl(f.card_image_url.trim())) {
      errors.card_image_url = "Lien d'image invalide (https://…)"
    }
    const invalidButton = f.card_buttons.some((b) => !b.title.trim() || (b.type === 'web_url' && !isHttpUrl((b.url ?? '').trim())))
    if (invalidButton) errors.card_buttons = 'Chaque bouton doit avoir un titre et, pour un lien, une URL valide (https://…)'
  }

  if (f.schedule_mode === 'later') {
    if (!f.scheduled_at) {
      errors.scheduled_at = 'Choisissez une date'
    } else if (new Date(f.scheduled_at).getTime() <= Date.now()) {
      errors.scheduled_at = 'La date doit être dans le futur'
    }
  }

  return errors
}

export function buildCampaignPayload(
  f: CampaignFormState,
  channelAccountId: string,
): Partial<Campaign> & { channel_account_id: string } {
  const isCard = f.response_type === 'card'
  return {
    channel_account_id: channelAccountId,
    name: f.name.trim(),
    message_template: f.message.trim(),
    // Never send tag_ids alongside a segment_id — exactly one targeting mode is active at a time.
    audience_tag_ids: f.audience_mode === 'tags' ? f.tag_ids : [],
    segment_id: f.audience_mode === 'segment' ? f.segment_id || null : null,
    scheduled_at: f.schedule_mode === 'later' && f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
    response_type: f.response_type,
    card_title: isCard ? f.card_title.trim() : '',
    card_subtitle: isCard ? f.card_subtitle.trim() : '',
    card_image_url: isCard ? f.card_image_url.trim() : '',
    card_buttons: isCard ? f.card_buttons : [],
  }
}
