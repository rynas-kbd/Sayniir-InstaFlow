'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OptionPicker } from '@/components/shared/option-picker'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Field, FormSection } from '@/components/shared/form-section'
import { ManageSegmentsDialog } from '../manage-segments-dialog'
import type { Tag } from '@/components/contacts/types'
import type { Segment } from '../types'
import type { CampaignFormApi } from './types'

const COUNT_DEBOUNCE_MS = 400

export function AudiencePicker({
  api,
  tags,
  segments,
  onSegmentsChange,
}: {
  api: CampaignFormApi
  tags: Tag[]
  segments: Segment[]
  onSegmentsChange: (segments: Segment[]) => void
}) {
  const { form, setField, channelAccountId } = api
  const [count, setCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    // All setState calls happen inside the timeout callback (a real async boundary) — never
    // synchronously in the effect body itself, which react-hooks/set-state-in-effect flags as a
    // cascading-render risk.
    const timeout = setTimeout(() => {
      if (form.audience_mode === 'segment' && !form.segment_id) {
        setCount(null)
        setLoadingCount(false)
        return
      }
      setLoadingCount(true)
      fetch('/api/campaigns/audience-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelAccountId,
          tagIds: form.audience_mode === 'tags' ? form.tag_ids : [],
          segmentId: form.audience_mode === 'segment' ? form.segment_id : null,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setCount(data ? data.count : null))
        .catch(() => setCount(null))
        .finally(() => setLoadingCount(false))
    }, COUNT_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [channelAccountId, form.audience_mode, form.tag_ids, form.segment_id])

  function toggleTag(id: string) {
    setField('tag_ids', form.tag_ids.includes(id) ? form.tag_ids.filter((t) => t !== id) : [...form.tag_ids, id])
  }

  return (
    <FormSection
      icon={Users}
      label="Audience"
      action={<ManageSegmentsDialog channelAccountId={channelAccountId} tags={tags} segments={segments} onChange={onSegmentsChange} />}
    >
      <OptionPicker
        name="Cible"
        compact
        value={form.audience_mode}
        onChange={(v) => setField('audience_mode', v)}
        options={[
          { value: 'all', label: 'Tous les contacts' },
          { value: 'tags', label: 'Tags' },
          { value: 'segment', label: 'Segment' },
        ]}
      />

      {form.audience_mode === 'tags' &&
        (tags.length === 0 ? (
          <p className="pt-1 text-xs text-muted-foreground">Aucun tag créé.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => {
              const selected = form.tag_ids.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    selected
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        ))}

      {form.audience_mode === 'segment' && (
        <div className="pt-1">
          <Field label="Segment" htmlFor="c-segment">
            <Select value={form.segment_id || undefined} onValueChange={(v) => setField('segment_id', v ?? '')}>
              <SelectTrigger id="c-segment" className="w-full">
                <SelectValue placeholder="Choisir un segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      <p className="pt-1 text-[11px] text-muted-foreground">
        {loadingCount ? 'Calcul…' : count !== null ? `${count} contact(s) seront touchés` : ''}
      </p>
    </FormSection>
  )
}
