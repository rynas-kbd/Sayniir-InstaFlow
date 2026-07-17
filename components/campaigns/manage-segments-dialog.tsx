'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Tag } from '@/components/contacts/types'

export interface Segment {
  id: string
  name: string
  tag_ids: string[]
  custom_field_key: string | null
  custom_field_value: string | null
  min_days_since_last_inbound: number | null
}

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
      toast.success('Segment créé')
    } catch {
      toast.error('Impossible de créer le segment')
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
      toast.success('Segment supprimé')
    } catch {
      toast.error('Impossible de supprimer le segment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Layers className="size-3.5" /> Gérer les segments
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Segments</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {segments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun segment créé.</p>
          ) : (
            segments.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{s.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {s.tag_ids.length} tag(s)
                    {s.custom_field_key && ` · ${s.custom_field_key}=${s.custom_field_value}`}
                    {s.min_days_since_last_inbound != null && ` · inactif ${s.min_days_since_last_inbound}j+`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSegment(s.id)}
                  className="-m-1 shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2.5 border-t border-border pt-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nouveau segment</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du segment" />
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
            <Input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} placeholder="Champ perso (ex: budget)" className="text-xs" />
            <Input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} placeholder="= valeur" className="text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Inactif depuis au moins (jours, optionnel)</Label>
            <Input type="number" min={1} value={minDays} onChange={(e) => setMinDays(e.target.value)} placeholder="ex: 7" />
          </div>
          <Button type="button" size="sm" onClick={createSegment} disabled={saving || !name.trim()} className="w-full">
            <Plus className="size-3.5" /> {saving ? 'Création…' : 'Créer le segment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
