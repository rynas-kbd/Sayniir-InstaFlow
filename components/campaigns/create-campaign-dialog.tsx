'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import type { Tag } from '@/components/contacts/types'

export function CreateCampaignDialog({
  channelAccountId,
  tags,
  asCard = false,
}: {
  channelAccountId: string
  tags: Tag[]
  asCard?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleTag(tagId: string) {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_account_id: channelAccountId,
          name: name.trim(),
          message_template: message.trim(),
          audience_tag_ids: selectedTags,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      setOpen(false)
      setName('')
      setMessage('')
      setSelectedTags([])
      setScheduledAt('')
      toast.success('Campagne créée')
      router.refresh()
    } catch {
      toast.error('Impossible de créer la campagne')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          asCard ? (
            <button className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary" />
          ) : (
            <Button />
          )
        }
      >
        {asCard ? (
          <>
            <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
              <Plus className="size-5" />
            </div>
            <span className="text-sm font-medium">Nouvelle campagne</span>
          </>
        ) : (
          <>
            <Plus className="size-4" /> Nouvelle campagne
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Nom</Label>
            <Input
              id="campaign-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Promo Ramadan"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-message">Message</Label>
            <Textarea
              id="campaign-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour ! Nouvelle offre disponible…"
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Audience (tags — vide = tous les contacts abonnés)</Label>
            <div className="flex flex-wrap gap-3">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun tag créé.</p>
              ) : (
                tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={selectedTags.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                    {tag.name}
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-schedule">Planifier (optionnel)</Label>
            <Input id="campaign-schedule" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !message.trim()}>
              {saving ? 'Création…' : scheduledAt ? 'Planifier' : 'Créer en brouillon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
