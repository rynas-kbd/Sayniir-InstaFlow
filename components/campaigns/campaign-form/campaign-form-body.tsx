'use client'

import { Type, LayoutTemplate } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OptionPicker } from '@/components/shared/option-picker'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { CardFieldsEditor } from '@/components/shared/card-fields-editor'
import { AudiencePicker } from './audience-picker'
import { SchedulePicker } from './schedule-picker'
import type { Tag } from '@/components/contacts/types'
import type { Segment } from '../types'
import type { CampaignFormApi } from './types'

export function CampaignFormBody({
  api,
  tags,
  segments,
  onSegmentsChange,
  autoFocusName,
}: {
  api: CampaignFormApi
  tags: Tag[]
  segments: Segment[]
  onSegmentsChange: (segments: Segment[]) => void
  autoFocusName?: boolean
}) {
  const { form, errors, setField, channelAccountId } = api

  return (
    <div className="flex flex-col gap-4">
      <FormSection icon={Type} label="Contenu">
        <Field label="Nom" htmlFor="c-name" required error={errors.name} hint="Interne — n'est jamais montré aux clients.">
          <Input
            {...fieldA11y('c-name', { hint: "Interne — n'est jamais montré aux clients.", error: errors.name })}
            autoFocus={autoFocusName}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex : Promo Ramadan"
          />
        </Field>
        <Field
          label="Message"
          htmlFor="c-message"
          required
          error={errors.message}
          hint="Variables disponibles : {{prenom}}, {{nom}}, {{telephone}}, {{email}}, {{champ.CLE}}."
        >
          <Textarea
            {...fieldA11y('c-message', { error: errors.message })}
            value={form.message}
            onChange={(e) => setField('message', e.target.value)}
            placeholder="Bonjour {{prenom}} ! Nouvelle offre disponible…"
            rows={4}
          />
        </Field>
      </FormSection>

      <FormSection icon={LayoutTemplate} label="Réponse">
        <OptionPicker
          name="Type de réponse"
          compact
          value={form.response_type}
          onChange={(v) => setField('response_type', v)}
          options={[
            { value: 'text', label: 'Texte', icon: Type },
            { value: 'card', label: 'Carte', icon: LayoutTemplate },
          ]}
        />
        {form.response_type === 'card' && (
          <CardFieldsEditor
            title={form.card_title}
            subtitle={form.card_subtitle}
            imageUrl={form.card_image_url}
            buttons={form.card_buttons}
            onTitleChange={(v) => setField('card_title', v)}
            onSubtitleChange={(v) => setField('card_subtitle', v)}
            onImageUrlChange={(v) => setField('card_image_url', v)}
            onButtonsChange={(v) => setField('card_buttons', v)}
            channelAccountId={channelAccountId}
            folder="campaigns"
          />
        )}
      </FormSection>

      <AudiencePicker api={api} tags={tags} segments={segments} onSegmentsChange={onSegmentsChange} />
      <SchedulePicker api={api} />
    </div>
  )
}
