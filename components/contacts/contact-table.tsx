'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, X, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="rounded-lg border border-border bg-card py-16 text-center shadow-sm">
        <Users className="mx-auto mb-3 size-8 text-muted-foreground/50" strokeWidth={1} />
        <p className="mb-1 text-sm font-medium text-foreground">Aucun contact</p>
        <p className="text-sm text-muted-foreground">Les contacts apparaissent dès leur premier message.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Dernier message</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const displayName = contact.full_name ?? (contact.username ? `@${contact.username}` : contact.sender_id)
            return (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="font-medium">{displayName}</div>
                  {contact.phone && <div className="text-xs text-muted-foreground">{contact.phone}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    {contact.contact_tags.map((ct) => (
                      <Badge key={ct.tag_id} variant="outline" style={{ borderColor: ct.tags.color, color: ct.tags.color }}>
                        {ct.tags.name}
                      </Badge>
                    ))}
                    <Popover>
                      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Plus className="size-3" />
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1.5">
                        {tags.length === 0 ? (
                          <p className="p-2 text-xs text-muted-foreground">Aucun tag créé.</p>
                        ) : (
                          tags.map((tag) => {
                            const active = contact.contact_tags.some((ct) => ct.tag_id === tag.id)
                            return (
                              <button
                                key={tag.id}
                                onClick={() => toggleTag(contact, tag)}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                  {tag.name}
                                </span>
                                {active && <X className="size-3.5 text-muted-foreground" />}
                              </button>
                            )
                          })
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {contact.last_inbound_at ? new Date(contact.last_inbound_at).toLocaleDateString('fr-FR') : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setDeletingId(contact.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
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
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteContact(deletingId)} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
