'use client'

import { OptionPicker } from '@/components/shared/option-picker'
import { useT } from '@/components/i18n-provider'
import type { RuleFormApi } from './types'

/** Replaces the old plain <Select> for a 3-way, near-equiprobable semantic choice — exactly the
 * case OptionPicker targets. */
export function ReplyMethodPicker({ api }: { api: RuleFormApi }) {
  const t = useT()
  const { form, setField } = api
  return (
    <OptionPicker
      name={t('automation.replyMethodPicker.name')}
      compact
      value={form.reply_method}
      onChange={(v) => setField('reply_method', v)}
      options={[
        { value: 'comment', label: t('automation.replyMethodPicker.comment') },
        { value: 'dm', label: t('automation.replyMethodPicker.dm') },
        { value: 'both', label: t('automation.replyMethodPicker.both') },
      ]}
    />
  )
}
