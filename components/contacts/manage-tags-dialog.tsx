'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
          <DialogTitle>Gérer les tags</DialogTitle>
        </DialogHeader>

        <form onSubmit={createTag} className="flex gap-2">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du tag" />
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="size-5 shrink-0 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: color === c ? 'var(--foreground)' : 'transparent' }}
                aria-label={c}
              />
            ))}
          </div>
          <Button type="submit" size="icon" disabled={saving || !name.trim()} aria-label="Créer le tag">
            <Plus className="size-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="gap-1">
              {tag.name}
              <button type="button" onClick={() => deleteTag(tag.id)} aria-label="Supprimer">
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && <p className="text-xs text-muted-foreground">Aucun tag pour l&apos;instant.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
