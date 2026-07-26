import type { AutomationRule, RuleFormPayload } from '../types'
import type { RuleFormErrors, RuleFormState } from './types'

export const FIELD_IDS: Record<keyof RuleFormState, string> = {
  channel_account_id: 'r-account',
  name: 'r-name',
  trigger_type: 'r-trigger-type',
  trigger_keywords: 'r-keywords',
  target_post_ids: 'r-target-posts',
  reply_method: 'r-reply-method',
  response_text: 'r-response',
  response_text_dm: 'r-response-dm',
  response_type: 'r-response-type',
  card_title: 'r-card-title',
  card_subtitle: 'r-card-subtitle',
  card_image_url: 'r-card-image',
  card_buttons: 'r-card-buttons',
}

export function emptyForm(rule: AutomationRule | undefined, defaultTab: 'dm' | 'comment', defaultAccountId: string): RuleFormState {
  return {
    channel_account_id: rule?.channel_account_id ?? defaultAccountId,
    name: rule?.name ?? '',
    trigger_type: rule?.trigger_type ?? (defaultTab === 'dm' ? 'any_message' : 'any_comment'),
    trigger_keywords: rule?.trigger_keywords ?? [],
    target_post_ids: rule?.target_post_ids ?? [],
    reply_method: rule?.reply_method ?? 'comment',
    response_text: rule?.response_text ?? '',
    response_text_dm: rule?.response_text_dm ?? '',
    response_type: rule?.response_type ?? 'text',
    card_title: rule?.card_title ?? '',
    card_subtitle: rule?.card_subtitle ?? '',
    card_image_url: rule?.card_image_url ?? '',
    card_buttons: rule?.card_buttons ?? [],
  }
}

export function deriveFlags(f: RuleFormState, defaultTab: 'dm' | 'comment') {
  const isDmCapable = defaultTab === 'dm' || f.reply_method !== 'comment'
  const isCard = isDmCapable && f.response_type === 'card'
  // Mirrors the exact display conditions of the original rule-form-fields.tsx so validation never
  // requires a field the user can't see.
  const showsCommentText = !isDmCapable || (defaultTab === 'comment' && f.reply_method === 'both')
  const showsDmText = isDmCapable && !isCard && (defaultTab === 'dm' || f.reply_method === 'dm')
  return { isDmCapable, isCard, showsCommentText, showsDmText }
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Kind-aware like the product/campaign validators — only inspects fields the current
 * trigger_type/reply_method/response_type combination actually renders. */
export function validateRuleForm(f: RuleFormState, defaultTab: 'dm' | 'comment'): RuleFormErrors {
  const errors: RuleFormErrors = {}
  const { isCard, showsCommentText, showsDmText } = deriveFlags(f, defaultTab)

  if (!f.channel_account_id) errors.channel_account_id = 'Choisissez un compte'

  if (!f.name.trim()) errors.name = 'Le nom est obligatoire'
  else if (f.name.trim().length > 120) errors.name = '120 caractères maximum'

  if ((f.trigger_type === 'keyword' || f.trigger_type === 'comment_keyword') && f.trigger_keywords.length === 0) {
    errors.trigger_keywords = 'Ajoutez au moins un mot-clé'
  }

  if ((showsCommentText || showsDmText) && !f.response_text.trim()) {
    errors.response_text = 'Le message de réponse est obligatoire'
  }

  if (isCard) {
    if (!f.card_title.trim()) errors.card_title = 'Le titre de la carte est obligatoire'
    if (f.card_image_url.trim() !== '' && !isHttpUrl(f.card_image_url.trim())) {
      errors.card_image_url = "Lien d'image invalide (https://…)"
    }
    const invalidButton = f.card_buttons.some((b) => !b.title.trim() || (b.type === 'web_url' && !isHttpUrl((b.url ?? '').trim())))
    if (invalidButton) errors.card_buttons = 'Chaque bouton doit avoir un titre et, pour un lien, une URL valide (https://…)'
  }

  return errors
}

export function buildRulePayload(f: RuleFormState, defaultTab: 'dm' | 'comment'): RuleFormPayload {
  const { isCard } = deriveFlags(f, defaultTab)
  const fallbackText = f.card_title || f.name

  return {
    channel_account_id: f.channel_account_id,
    name: f.name.trim(),
    trigger_type: f.trigger_type,
    trigger_keywords: f.trigger_type === 'keyword' || f.trigger_type === 'comment_keyword' ? f.trigger_keywords : null,
    target_post_ids: f.target_post_ids.length > 0 ? f.target_post_ids : null,
    reply_method: f.reply_method,
    response_text: isCard && (defaultTab === 'dm' || f.reply_method === 'dm') ? fallbackText : f.response_text,
    response_text_dm: f.response_text_dm,
    response_type: isCard ? 'card' : 'text',
    card_title: f.card_title,
    card_subtitle: f.card_subtitle,
    card_image_url: f.card_image_url,
    card_buttons: f.card_buttons,
  }
}
