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
  role?: 'admin' | 'agent'
  accepted_at?: string | null
}

export function TeamMembersCard({
  channelAccountId,
  initialMembers,
  userPlan = 'free',
}: {
  channelAccountId: string
  initialMembers: TeamMember[]
  userPlan?: string
}) {
  const [members, setMembers] = useState(initialMembers)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [saving, setSaving] = useState(false)

  const isPremium = userPlan === 'premium'
  const isLimitReached = members.length >= 10

  async function addMember() {
    if (!name.trim() || !email.trim() || !isPremium || isLimitReached) return
    setSaving(true)
    try {
      // Real invite (Supabase Auth login, not just a directory entry) — see
      // app/api/team/invite/route.ts. Requires SMTP configured on the
      // Supabase project for the invite email to actually be delivered.
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, name: name.trim(), email: email.trim(), role }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Impossible d'inviter ce membre")
      }
      const created: TeamMember = await res.json()
      setMembers((prev) => [created, ...prev])
      setName('')
      setEmail('')
      setRole('agent')
      toast.success('Invitation envoyée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'inviter ce membre")
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
                    <p className="text-[13px] font-semibold text-foreground">
                      {m.name}
                      {m.role && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">({m.role === 'admin' ? 'admin' : 'agent'})</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.email} · {m.accepted_at ? 'Actif' : 'Invité — en attente'}
                    </p>
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

        {!isPremium ? (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-relaxed text-warning-foreground">
            ⚠️ Le partage d&apos;inbox et l&apos;ajout de membres d&apos;équipe sont réservés au plan <strong>Premium</strong>.
          </div>
        ) : isLimitReached ? (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-relaxed text-warning-foreground">
            ⚠️ Limite de 10 membres d&apos;équipe atteinte pour votre plan Premium.
          </div>
        ) : (
          <FormSection icon={UserPlus} label="Inviter un membre">
            <div className="flex items-center gap-1.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="text-xs" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="text-xs" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                aria-label="Rôle"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="button" size="icon-sm" onClick={addMember} disabled={saving || !name.trim() || !email.trim()} aria-label="Inviter">
                <Plus className="size-3.5" />
              </Button>
            </div>
          </FormSection>
        )}
      </CardContent>
    </Card>
  )
}
