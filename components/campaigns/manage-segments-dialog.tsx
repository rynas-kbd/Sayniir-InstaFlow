'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Layers, Plus, Trash2, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import { FormDialogHeader, FormSection } from '@/components/shared/form-section'
import type { Tag } from '@/components/contacts/types'
import type { Segment } from './types'
import { useT } from '@/components/i18n-provider'

export function ManageSegmentsDialog({
  channelAccountId,
  tags,
  segments: initialSegments,
  onChange,
}: {
  channelAccountId: string
  tags: Tag[]
  segments: Segment[]
  onChange: (segments: Segment[]) => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [segments, setSegments] = useState(initialSegments)
  const [name, setName] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [fieldKey, setFieldKey] = useState('')
  const [fieldValue, setFieldValue] = useState('')
  const [minDays, setMinDays] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function createSegment() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_account_id: channelAccountId,
          name: name.trim(),
          tag_ids: selectedTags,
          custom_field_key: fieldKey.trim() || null,
          custom_field_value: fieldValue.trim() || null,
          min_days_since_last_inbound: minDays ? Number(minDays) : null,
        }),
      })
      if (!res.ok) throw new Error()
      const created: Segment = await res.json()
      const next = [created, ...segments]
      setSegments(next)
      onChange(next)
      setName('')
      setSelectedTags([])
      setFieldKey('')
      setFieldValue('')
      setMinDays('')
      toast.success(t('campaigns.segmentsDialog.toastCreateSuccess'))
    } catch {
      toast.error(t('campaigns.segmentsDialog.toastCreateError'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteSegment(id: string) {
    try {
      const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const next = segments.filter((s) => s.id !== id)
      setSegments(next)
      onChange(next)
      toast.success(t('campaigns.segmentsDialog.toastDeleteSuccess'))
    } catch {
      toast.error(t('campaigns.segmentsDialog.toastDeleteError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Layers className="size-3.5" /> {t('campaigns.segmentsDialog.trigger')}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <FormDialogHeader icon={Layers} title={t('campaigns.segmentsDialog.title')} description={t('campaigns.segmentsDialog.description')} />
        </DialogHeader>

        <FormSection icon={List} label={t('campaigns.segmentsDialog.existingLabel')}>
          <div className="space-y-2">
            {segments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t('campaigns.segmentsDialog.empty')}</p>
            ) : (
              segments.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{s.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.plural('campaigns.segmentsDialog.tagCount', s.tag_ids.length)}
                      {s.custom_field_key && t('campaigns.segmentsDialog.customFieldSuffix', { key: s.custom_field_key, value: s.custom_field_value ?? '' })}
                      {s.min_days_since_last_inbound != null && t('campaigns.segmentsDialog.inactiveSuffix', { days: s.min_days_since_last_inbound })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSegment(s.id)}
                    className="-m-1 shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground hover:text-destructive"
                    aria-label={t('campaigns.segmentsDialog.deleteAria')}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </FormSection>

        <FormSection icon={Filter} label={t('campaigns.segmentsDialog.newLabel')}>
          <div className="space-y-2.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('campaigns.segmentsDialog.namePlaceholder')} />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1.5 text-xs">
                    <Checkbox checked={selectedTags.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                    {tag.name}
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} placeholder={t('campaigns.segmentsDialog.fieldKeyPlaceholder')} className="text-xs" />
              <Input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} placeholder={t('campaigns.segmentsDialog.fieldValuePlaceholder')} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('campaigns.segmentsDialog.inactiveLabel')}</Label>
              <Input type="number" min={1} value={minDays} onChange={(e) => setMinDays(e.target.value)} placeholder={t('campaigns.segmentsDialog.inactivePlaceholder')} />
            </div>
            <Button type="button" size="sm" onClick={createSegment} disabled={saving || !name.trim()} className="w-full">
              <Plus className="size-3.5" /> {saving ? t('campaigns.segmentsDialog.creating') : t('campaigns.segmentsDialog.createButton')}
            </Button>
          </div>
        </FormSection>
      </DialogContent>
    </Dialog>
  )
}
