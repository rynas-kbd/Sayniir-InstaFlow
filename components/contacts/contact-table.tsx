'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, X, Trash2, Tag as TagIcon, Phone, User, ListPlus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Contact, Tag } from './types'

// Dynamic premium avatar colors
const AVATAR_PALETTE = [
  'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}

export function ContactTable({
  channelAccountId,
  initialContacts,
  tags,
}: {
  channelAccountId: string
  initialContacts: Contact[]
  tags: Tag[]
}) {
  const [contacts, setContacts] = useState(initialContacts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function toggleTag(contact: Contact, tag: Tag) {
    const hasTag = contact.contact_tags.some((ct) => ct.tag_id === tag.id)
    try {
      if (hasTag) {
        await fetch(`/api/contacts/${contact.id}/tags?tagId=${tag.id}`, { method: 'DELETE' })
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, contact_tags: c.contact_tags.filter((ct) => ct.tag_id !== tag.id) } : c))
        )
      } else {
        await fetch(`/api/contacts/${contact.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: tag.id, channel_account_id: channelAccountId }),
        })
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, contact_tags: [...c.contact_tags, { tag_id: tag.id, tags: tag }] } : c))
        )
      }
    } catch {
      toast.error('Impossible de mettre à jour les tags')
    }
  }

  async function saveCustomFields(contactId: string, fields: Record<string, string>) {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_fields: fields }),
      })
      if (!res.ok) throw new Error('Erreur')
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, custom_fields: fields } : c)))
      toast.success('Champs personnalisés enregistrés')
    } catch {
      toast.error('Impossible d\'enregistrer les champs')
    }
  }

  async function deleteContact(id: string) {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Contact supprimé')
    } catch {
      toast.error('Impossible de supprimer le contact')
    } finally {
      setDeletingId(null)
    }
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun contact"
        description="Les contacts de votre CRM apparaîtront automatiquement dès leur premier message."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-b border-border/60">
            <TableHead className="font-semibold text-foreground/80 px-3 sm:px-5 py-4">Client</TableHead>
            <TableHead className="font-semibold text-foreground/80 px-3 sm:px-5 py-4">Tags</TableHead>
            <TableHead className="hidden font-semibold text-foreground/80 px-5 py-4 sm:table-cell">Dernier inbound</TableHead>
            <TableHead className="text-right font-semibold text-foreground/80 px-3 sm:px-5 py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/40">
          {contacts.map((contact) => {
            const displayName = contact.full_name ?? (contact.username ? `@${contact.username}` : contact.sender_id)
            const initial = (contact.full_name?.[0] ?? contact.username?.[0] ?? '?').toUpperCase()
            const avatarColorClass = getAvatarColor(contact.sender_id)

            return (
              <TableRow key={contact.id} className="group hover:bg-muted/10 transition-colors border-b border-border/40 last:border-0">
                {/* Client Profile and Details */}
                <TableCell className="px-3 sm:px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${avatarColorClass}`}>
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm line-clamp-1">{displayName}</div>
                      {contact.phone && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="size-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Tag Pills and add tags popover */}
                <TableCell className="px-3 sm:px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {contact.contact_tags.map((ct) => (
                      <Badge
                        key={ct.tag_id}
                        variant="outline"
                        className="text-[10px] font-medium py-0 px-2 rounded-full border bg-card"
                        style={{ borderColor: ct.tags.color + '40', color: ct.tags.color, backgroundColor: ct.tags.color + '0a' }}
                      >
                        {ct.tags.name}
                      </Badge>
                    ))}
                    <Popover>
                      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="size-6 rounded-full border border-border/60 hover:bg-muted hover:border-border" />}>
                        <Plus className="size-3 text-muted-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-1.5" align="start">
                        <div className="mb-1.5 px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Gérer les tags
                        </div>
                        {tags.length === 0 ? (
                          <p className="p-2 text-xs text-muted-foreground italic">Aucun tag créé.</p>
                        ) : (
                          <div className="space-y-0.5 max-h-52 overflow-y-auto">
                            {tags.map((tag) => {
                              const active = contact.contact_tags.some((ct) => ct.tag_id === tag.id)
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleTag(contact, tag)}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted transition-all"
                                >
                                  <span className="flex items-center gap-2 font-medium">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                    {tag.name}
                                  </span>
                                  {active && <X className="size-3.5 text-muted-foreground hover:text-foreground" />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableCell>

                {/* Last Message Inbound */}
                <TableCell className="hidden px-5 py-3.5 text-xs text-muted-foreground/80 font-medium sm:table-cell">
                  {contact.last_inbound_at ? (
                    new Date(contact.last_inbound_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  ) : (
                    <span className="opacity-50">—</span>
                  )}
                </TableCell>

                {/* Action buttons */}
                <TableCell className="px-3 sm:px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CustomFieldsPopover contact={contact} onSave={(fields) => saveCustomFields(contact.id, fields)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(contact.id)}
                      className="size-8 rounded-lg text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Supprimer contact"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog open={deletingId !== null} onOpenChange={(next) => !next && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données, tags et historiques de messages associés à ce contact seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteContact(deletingId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CustomFieldsPopover({
  contact,
  onSave,
}: {
  contact: Contact
  onSave: (fields: Record<string, string>) => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Array<{ key: string; value: string }>>([])
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      const entries = Object.entries(contact.custom_fields ?? {})
      setRows(entries.length > 0 ? entries.map(([key, value]) => ({ key, value: String(value) })) : [{ key: '', value: '' }])
    }
  }

  async function handleSave() {
    setSaving(true)
    const fields: Record<string, string> = {}
    for (const row of rows) {
      if (row.key.trim()) fields[row.key.trim()] = row.value
    }
    try {
      await onSave(fields)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const count = Object.keys(contact.custom_fields ?? {}).length

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 rounded-lg text-muted-foreground opacity-100 transition-all hover:bg-primary/10 hover:text-primary focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Champs personnalisés"
          />
        }
      >
        <ListPlus className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Champs personnalisés
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <Input
                value={row.key}
                onChange={(e) => {
                  const copy = [...rows]
                  copy[idx] = { ...copy[idx], key: e.target.value }
                  setRows(copy)
                }}
                placeholder="clé (ex: budget)"
                className="h-8 text-xs"
              />
              <Input
                value={row.value}
                onChange={(e) => {
                  const copy = [...rows]
                  copy[idx] = { ...copy[idx], value: e.target.value }
                  setRows(copy)
                }}
                placeholder="valeur"
                className="h-8 text-xs"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                className="-m-1 shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground hover:text-destructive"
                aria-label="Supprimer ce champ"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRows([...rows, { key: '', value: '' }])}
            className="cursor-pointer text-xs font-medium text-primary hover:underline"
          >
            + Ajouter un champ
          </button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
