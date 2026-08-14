'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Trash2, UserPlus, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { FormSection } from '@/components/shared/form-section'
import { useT } from '@/components/i18n-provider'

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
  const t = useT()
  const [members, setMembers] = useState(initialMembers)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [saving, setSaving] = useState(false)

  const isBusiness = userPlan === 'business'
  const isLimitReached = members.length >= 10

  async function addMember() {
    if (!name.trim() || !email.trim() || !isBusiness || isLimitReached) return
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
        throw new Error(errData.error || t('teamMembers.inviteError'))
      }
      const created: TeamMember = await res.json()
      setMembers((prev) => [created, ...prev])
      setName('')
      setEmail('')
      setRole('agent')
      toast.success(t('teamMembers.inviteSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('teamMembers.inviteError'))
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
      toast.error(t('teamMembers.removeError'))
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
            <p className="text-sm font-semibold text-foreground">{t('teamMembers.cardTitle')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('teamMembers.cardDescription')}</p>
          </div>
        </div>

        <FormSection icon={List} label={t('teamMembers.membersLabel')}>
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">{t('teamMembers.noMembers')}</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {m.name}
                      {m.role && (
                        <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                          ({m.role === 'admin' ? t('teamMembers.roleLabelAdmin') : t('teamMembers.roleLabelAgent')})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.email} · {m.accepted_at ? t('teamMembers.statusActive') : t('teamMembers.statusPending')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="cursor-pointer rounded p-1.5 text-muted-foreground hover:text-destructive"
                    aria-label={t('teamMembers.removeAriaLabel')}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </FormSection>

        {!isBusiness ? (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-relaxed text-warning-foreground">
            {t('teamMembers.businessOnlyWarningPrefix')} <strong>Business</strong>
            {t('teamMembers.businessOnlyWarningSuffix')}
          </div>
        ) : isLimitReached ? (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-relaxed text-warning-foreground">
            {t('teamMembers.limitReachedWarning')}
          </div>
        ) : (
          <FormSection icon={UserPlus} label={t('teamMembers.inviteLabel')}>
            <div className="flex items-center gap-1.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('teamMembers.namePlaceholder')} className="text-xs" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('teamMembers.emailPlaceholder')} className="text-xs" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                aria-label={t('teamMembers.roleAriaLabel')}
              >
                <option value="agent">{t('teamMembers.roleOptionAgent')}</option>
                <option value="admin">{t('teamMembers.roleOptionAdmin')}</option>
              </select>
              <Button
                type="button"
                size="icon-sm"
                onClick={addMember}
                disabled={saving || !name.trim() || !email.trim()}
                aria-label={t('teamMembers.inviteAriaLabel')}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </FormSection>
        )}
      </CardContent>
    </Card>
  )
}
