'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Tag as TagIcon, Palette, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import { FormDialogHeader, FormSection } from '@/components/shared/form-section'
import { useT } from '@/components/i18n-provider'
import type { Tag } from './types'

const COLORS = ['#b2622d', '#728157', '#645c50', '#b23a2e', '#643312', '#3d472b']

export function ManageTagsDialog({ channelAccountId, tags: initialTags }: { channelAccountId: string; tags: Tag[] }) {
  const [tags, setTags] = useState(initialTags)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const t = useT()

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
      if (!res.ok) throw new Error()
      const tag: Tag = await res.json()
      setTags((prev) => [...prev, tag])
      setName('')
      toast.success(t('contacts.tagsDialog.toastCreated'))
    } catch {
      toast.error(t('contacts.tagsDialog.toastCreateError'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteTag(id: string) {
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTags((prev) => prev.filter((tag) => tag.id !== id))
      toast.success(t('contacts.tagsDialog.toastDeleted'))
    } catch {
      toast.error(t('contacts.tagsDialog.toastDeleteError'))
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <TagIcon className="size-4" /> {t('contacts.tagsDialog.trigger')}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <FormDialogHeader
            icon={TagIcon}
            title={t('contacts.tagsDialog.title')}
            description={t('contacts.tagsDialog.description')}
          />
        </DialogHeader>

        <FormSection icon={Palette} label={t('contacts.tagsDialog.newTagSection')}>
          <form onSubmit={createTag} className="flex flex-wrap items-center gap-2.5">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('contacts.tagsDialog.namePlaceholder')}
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
            <Button
              type="submit"
              size="icon"
              disabled={saving || !name.trim()}
              aria-label={t('contacts.tagsDialog.createAria')}
            >
              <Plus className="size-4" />
            </Button>
          </form>
        </FormSection>

        <FormSection icon={List} label={t('contacts.tagsDialog.existingSection')}>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="gap-1">
                {tag.name}
                <button
                  type="button"
                  onClick={() => deleteTag(tag.id)}
                  aria-label={t('contacts.tagsDialog.deleteAria')}
                  className="-my-1 -mr-1 cursor-pointer rounded-full p-1.5"
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-xs text-muted-foreground">{t('contacts.tagsDialog.noTags')}</p>}
          </div>
        </FormSection>
      </DialogContent>
    </Dialog>
  )
}
