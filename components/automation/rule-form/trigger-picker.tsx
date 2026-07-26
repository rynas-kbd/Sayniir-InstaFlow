'use client'

import { MessageSquare, Hash } from 'lucide-react'
import { OptionPicker, type OptionPickerItem } from '@/components/shared/option-picker'
import type { TriggerType } from '../types'
import type { RuleFormApi } from './types'

const DM_OPTIONS: OptionPickerItem<TriggerType>[] = [
  { value: 'any_message', label: 'Tout DM', hint: 'Répond à tous les DM entrants', icon: MessageSquare },
  { value: 'keyword', label: 'Mot-clé (DM)', hint: 'Seulement si un mot-clé est présent', icon: Hash },
  { value: 'story_reply', label: 'Réponse à une story', hint: 'Quand un client répond à votre story', icon: MessageSquare },
  { value: 'story_mention', label: 'Mention en story', hint: 'Quand un client vous mentionne en story', icon: MessageSquare },
]

const COMMENT_OPTIONS: OptionPickerItem<TriggerType>[] = [
  { value: 'any_comment', label: 'Tout commentaire', hint: 'Répond à tous les commentaires publics', icon: MessageSquare },
  { value: 'comment_keyword', label: 'Mot-clé (Commentaire)', hint: 'Seulement si un mot-clé est présent', icon: Hash },
]

function needsKeywords(t: TriggerType) {
  return t === 'keyword' || t === 'comment_keyword'
}
function needsPosts(t: TriggerType) {
  return t === 'any_comment' || t === 'comment_keyword'
}

/** Picks the trigger type via the shared OptionPicker (gains role=radiogroup + hints + motion over
 * the old hand-rolled button row) and, unlike before, clears trigger_keywords/target_post_ids when
 * the new type no longer uses them — those used to linger silently in state. */
export function TriggerPicker({ api }: { api: RuleFormApi }) {
  const { form, setField, defaultTab } = api
  const options = defaultTab === 'dm' ? DM_OPTIONS : COMMENT_OPTIONS

  function handleChange(next: TriggerType) {
    setField('trigger_type', next)
    if (!needsKeywords(next) && form.trigger_keywords.length > 0) setField('trigger_keywords', [])
    if (!needsPosts(next) && form.target_post_ids.length > 0) setField('target_post_ids', [])
  }

  return <OptionPicker name="Déclencheur" value={form.trigger_type} onChange={handleChange} options={options} />
}
