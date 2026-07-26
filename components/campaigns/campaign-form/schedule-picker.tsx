'use client'

import { CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { OptionPicker } from '@/components/shared/option-picker'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { toDatetimeLocalValue } from './campaign-form-schema'
import type { CampaignFormApi } from './types'

export function SchedulePicker({ api }: { api: CampaignFormApi }) {
  const { form, errors, setField } = api
  const nowLocal = toDatetimeLocalValue(new Date().toISOString())

  return (
    <FormSection icon={CalendarClock} label="Planification">
      <OptionPicker
        name="Envoi"
        compact
        value={form.schedule_mode}
        onChange={(v) => setField('schedule_mode', v)}
        options={[
          { value: 'now', label: 'Envoyer maintenant' },
          { value: 'later', label: 'Planifier' },
        ]}
      />
      {form.schedule_mode === 'later' && (
        <div className="pt-1">
          <Field label="Date et heure" htmlFor="c-scheduled-at" error={errors.scheduled_at}>
            <Input
              {...fieldA11y('c-scheduled-at', { error: errors.scheduled_at })}
              type="datetime-local"
              min={nowLocal}
              value={form.scheduled_at}
              onChange={(e) => setField('scheduled_at', e.target.value)}
            />
          </Field>
        </div>
      )}
    </FormSection>
  )
}
