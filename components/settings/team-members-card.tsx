'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export interface TeamMember {
  id: string
  name: string
  email: string
}

export function TeamMembersCard({ channelAccountId, initialMembers }: { channelAccountId: string; initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  async function addMember() {
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, name: name.trim(), email: email.trim() }),
      })
      if (!res.ok) throw new Error()
      const created: TeamMember = await res.json()
      setMembers((prev) => [created, ...prev])
      setName('')
      setEmail('')
      toast.success('Membre ajouté')
    } catch {
      toast.error("Impossible d'ajouter ce membre")
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(id: string) {
    try {
      const res = await fetch(`/api/team-members/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      toast.error('Impossible de supprimer')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <CardTitle className="text-sm">Équipe</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Ajoutez les membres de votre équipe pour leur assigner des conversations dans l&apos;inbox.
        </p>
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">Aucun membre ajouté.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="cursor-pointer rounded p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Retirer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="text-xs" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="text-xs" />
          <Button type="button" size="icon-sm" onClick={addMember} disabled={saving || !name.trim() || !email.trim()} aria-label="Ajouter">
            <Plus className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
