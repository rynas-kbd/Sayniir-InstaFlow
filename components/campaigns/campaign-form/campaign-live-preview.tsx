'use client'

import { Eye, Users, CalendarClock } from 'lucide-react'
import { MessagePreview } from '@/components/shared/message-preview'
import type { Tag } from '@/components/contacts/types'
import type { Segment } from '../types'
import type { CampaignFormState } from './types'

export function CampaignLivePreview({ form, tags, segments }: { form: CampaignFormState; tags: Tag[]; segments: Segment[] }) {
  const audienceLabel =
    form.audience_mode === 'all'
      ? 'Tous les contacts'
      : form.audience_mode === 'tags'
        ? form.tag_ids.length > 0
          ? tags
              .filter((t) => form.tag_ids.includes(t.id))
              .map((t) => t.name)
              .join(', ')
          : 'Aucun tag sélectionné'
        : segments.find((s) => s.id === form.segment_id)?.name ?? 'Aucun segment sélectionné'

  const scheduleLabel = form.schedule_mode === 'later' && form.scheduled_at ? new Date(form.scheduled_at).toLocaleString('fr-FR') : 'Dès la création'

  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <Eye className="size-3" /> Aperçu du message
      </span>
      <MessagePreview
        responseType={form.response_type}
        text={form.message}
        card={{ title: form.card_title, subtitle: form.card_subtitle, imageUrl: form.card_image_url, buttons: form.card_buttons }}
        placeholder
      />
      <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-card/50 p-2.5 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Users className="size-3 shrink-0" /> {audienceLabel}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarClock className="size-3 shrink-0" /> {scheduleLabel}
        </p>
      </div>
    </div>
  )
}
