'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { useT } from '@/components/i18n-provider'
import type { ProductFormApi } from './types'

/** The kind-specific section (service/digital/subscription/event), swapped with a short fade+slide
 * when `kind` changes. `initial={false}` so nothing animates on mount — the edit dialog mounts
 * already populated. Never animate height here: it re-lays-out every frame and jitters the sticky
 * live preview next to it. */
export function KindDetailsFields({ api }: { api: ProductFormApi }) {
  const { form } = api
  if (form.kind === 'physical') return null

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={form.kind}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {form.kind === 'service' && <ServiceFields api={api} />}
        {form.kind === 'digital' && <DigitalFields api={api} />}
        {form.kind === 'subscription' && <SubscriptionFields api={api} />}
        {form.kind === 'event' && <EventFields api={api} />}
      </motion.div>
    </AnimatePresence>
  )
}

function ServiceFields({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, errors, setField } = api
  return (
    <FormSection icon={Calendar} label={t('boutique.productForm.kindDetailsFields.service.sectionLabel')}>
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label={t('boutique.productForm.kindDetailsFields.service.durationLabel')} htmlFor="p-duration" error={errors.duration_minutes}>
            <Input
              {...fieldA11y('p-duration', { error: errors.duration_minutes })}
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setField('duration_minutes', e.target.value)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label={t('boutique.productForm.kindDetailsFields.service.locationLabel')} htmlFor="p-location">
            <Input
              id="p-location"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder={t('boutique.productForm.kindDetailsFields.service.locationPlaceholder')}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}

function DigitalFields({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, errors, setField } = api
  return (
    <FormSection icon={Calendar} label={t('boutique.productForm.kindDetailsFields.digital.sectionLabel')}>
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label={t('boutique.productForm.kindDetailsFields.digital.fileUrlLabel')} htmlFor="p-file" error={errors.file_url}>
            <Input
              {...fieldA11y('p-file', { error: errors.file_url })}
              type="url"
              value={form.file_url}
              onChange={(e) => setField('file_url', e.target.value)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field
            label={t('boutique.productForm.kindDetailsFields.digital.downloadLimitLabel')}
            htmlFor="p-download-limit"
            error={errors.download_limit}
            hint={t('boutique.productForm.kindDetailsFields.digital.downloadLimitHint')}
          >
            <Input
              {...fieldA11y('p-download-limit', { hint: t('boutique.productForm.kindDetailsFields.digital.downloadLimitHint'), error: errors.download_limit })}
              type="number"
              value={form.download_limit}
              onChange={(e) => setField('download_limit', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}

function SubscriptionFields({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, setField } = api
  return (
    <FormSection icon={Calendar} label={t('boutique.productForm.kindDetailsFields.subscription.sectionLabel')}>
      <Field label={t('boutique.productForm.kindDetailsFields.subscription.billingPeriodLabel')} htmlFor="p-billing">
        <Select value={form.billing_period} onValueChange={(v) => setField('billing_period', (v ?? 'monthly') as 'monthly' | 'yearly')}>
          <SelectTrigger id="p-billing" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{t('boutique.productForm.kindDetailsFields.subscription.monthly')}</SelectItem>
            <SelectItem value="yearly">{t('boutique.productForm.kindDetailsFields.subscription.yearly')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </FormSection>
  )
}

function EventFields({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, errors, setField } = api
  return (
    <FormSection icon={Calendar} label={t('boutique.productForm.kindDetailsFields.event.sectionLabel')}>
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label={t('boutique.productForm.kindDetailsFields.event.dateLabel')} htmlFor="p-event-date" error={errors.event_date}>
            <Input
              {...fieldA11y('p-event-date', { error: errors.event_date })}
              type="date"
              value={form.event_date}
              onChange={(e) => setField('event_date', e.target.value)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label={t('boutique.productForm.kindDetailsFields.event.capacityLabel')} htmlFor="p-capacity" error={errors.capacity}>
            <Input
              {...fieldA11y('p-capacity', { error: errors.capacity })}
              type="number"
              value={form.capacity}
              onChange={(e) => setField('capacity', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}
