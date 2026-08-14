'use client'

import { MessageSquare, Hash } from 'lucide-react'
import { OptionPicker, type OptionPickerItem } from '@/components/shared/option-picker'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'
import type { TriggerType } from '../types'
import type { RuleFormApi } from './types'

function getDmOptions(t: Translator): OptionPickerItem<TriggerType>[] {
  return [
    { value: 'any_message', label: t('automation.triggerPicker.anyDm.label'), hint: t('automation.triggerPicker.anyDm.hint'), icon: MessageSquare },
    { value: 'keyword', label: t('automation.triggerPicker.keywordDm.label'), hint: t('automation.triggerPicker.keywordDm.hint'), icon: Hash },
    {
      value: 'story_reply',
      label: t('automation.triggerPicker.storyReply.label'),
      hint: t('automation.triggerPicker.storyReply.hint'),
      icon: MessageSquare,
    },
    {
      value: 'story_mention',
      label: t('automation.triggerPicker.storyMention.label'),
      hint: t('automation.triggerPicker.storyMention.hint'),
      icon: MessageSquare,
    },
  ]
}

function getCommentOptions(t: Translator): OptionPickerItem<TriggerType>[] {
  return [
    {
      value: 'any_comment',
      label: t('automation.triggerPicker.anyComment.label'),
      hint: t('automation.triggerPicker.anyComment.hint'),
      icon: MessageSquare,
    },
    {
      value: 'comment_keyword',
      label: t('automation.triggerPicker.keywordComment.label'),
      hint: t('automation.triggerPicker.keywordComment.hint'),
      icon: Hash,
    },
  ]
}

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
  const t = useT()
  const { form, setField, defaultTab } = api
  const options = defaultTab === 'dm' ? getDmOptions(t) : getCommentOptions(t)

  function handleChange(next: TriggerType) {
    setField('trigger_type', next)
    if (!needsKeywords(next) && form.trigger_keywords.length > 0) setField('trigger_keywords', [])
    if (!needsPosts(next) && form.target_post_ids.length > 0) setField('target_post_ids', [])
  }

  return <OptionPicker name={t('automation.triggerPicker.name')} value={form.trigger_type} onChange={handleChange} options={options} />
}
