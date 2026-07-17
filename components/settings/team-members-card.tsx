'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Trash2, UserPlus, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { FormSection } from '@/components/shared/form-section'

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
      <CardContent className="space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Équipe</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ajoutez des membres pour leur assigner des conversations dans l&apos;inbox.
            </p>
          </div>
        </div>

        <FormSection icon={List} label="Membres">
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">Aucun membre ajouté.</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
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
        </FormSection>

        <FormSection icon={UserPlus} label="Ajouter un membre">
          <div className="flex items-center gap-1.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="text-xs" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="text-xs" />
            <Button type="button" size="icon-sm" onClick={addMember} disabled={saving || !name.trim() || !email.trim()} aria-label="Ajouter">
              <Plus className="size-3.5" />
            </Button>
          </div>
        </FormSection>
      </CardContent>
    </Card>
  )
}
