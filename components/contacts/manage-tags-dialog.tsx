'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Tag as TagIcon, Palette, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import { FormDialogHeader, FormSection } from '@/components/shared/form-section'
import type { Tag } from './types'

const COLORS = ['#6366f1', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed']

export function ManageTagsDialog({ channelAccountId, tags: initialTags }: { channelAccountId: string; tags: Tag[] }) {
  const [tags, setTags] = useState(initialTags)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function createTag(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, name: name.trim(), color }),
      })
      if (!res.ok) throw new Error('Erreur')
      const tag: Tag = await res.json()
      setTags((prev) => [...prev, tag])
      setName('')
      toast.success('Tag créé')
    } catch {
      toast.error('Impossible de créer le tag')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTag(id: string) {
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setTags((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tag supprimé')
    } catch {
      toast.error('Impossible de supprimer le tag')
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <TagIcon className="size-4" /> Gérer les tags
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <FormDialogHeader icon={TagIcon} title="Gérer les tags" description="Organisez vos contacts par étiquettes colorées." />
        </DialogHeader>

        <FormSection icon={Palette} label="Nouveau tag">
          <form onSubmit={createTag} className="flex flex-wrap items-center gap-2.5">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du tag"
              className="min-w-[140px] flex-1"
            />
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-7 shrink-0 cursor-pointer rounded-full border-2 sm:size-5"
                  style={{ backgroundColor: c, borderColor: color === c ? 'var(--foreground)' : 'transparent' }}
                  aria-label={c}
                />
              ))}
            </div>
            <Button type="submit" size="icon" disabled={saving || !name.trim()} aria-label="Créer le tag">
              <Plus className="size-4" />
            </Button>
          </form>
        </FormSection>

        <FormSection icon={List} label="Tags existants">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="gap-1">
                {tag.name}
                <button
                  type="button"
                  onClick={() => deleteTag(tag.id)}
                  aria-label="Supprimer"
                  className="-my-1 -mr-1 cursor-pointer rounded-full p-1.5"
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-xs text-muted-foreground">Aucun tag pour l&apos;instant.</p>}
          </div>
        </FormSection>
      </DialogContent>
    </Dialog>
  )
}
