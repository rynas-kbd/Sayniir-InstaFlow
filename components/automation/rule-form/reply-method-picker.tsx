'use client'

import { OptionPicker } from '@/components/shared/option-picker'
import type { RuleFormApi } from './types'

/** Replaces the old plain <Select> for a 3-way, near-equiprobable semantic choice — exactly the
 * case OptionPicker targets. */
export function ReplyMethodPicker({ api }: { api: RuleFormApi }) {
  const { form, setField } = api
  return (
    <OptionPicker
      name="Action"
      compact
      value={form.reply_method}
      onChange={(v) => setField('reply_method', v)}
      options={[
        { value: 'comment', label: 'Commentaire' },
        { value: 'dm', label: 'DM privé' },
        { value: 'both', label: 'Les deux' },
      ]}
    />
  )
}
