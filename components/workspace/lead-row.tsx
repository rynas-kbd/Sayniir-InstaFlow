'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'

export interface Lead {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  qualification_status: string
  budget_range: string | null
  need_summary: string | null
  score: number | null
}

const STATUS_TONE: Record<string, StatusTone> = {
  new: 'neutral',
  qualifying: 'warning',
  qualified: 'success',
  disqualified: 'destructive',
  booked: 'primary',
  lost: 'destructive',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'Nouveau',
  qualifying: 'En qualification',
  qualified: 'Qualifié',
  disqualified: 'Disqualifié',
  booked: 'RDV pris',
  lost: 'Perdu',
}
const STATUS_BAR: Record<string, string> = {
  qualified: 'from-success/60 via-success to-success/60',
  booked: 'from-primary/60 via-primary to-primary/60',
}

export function LeadRow({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.qualification_status)
  const [loading, setLoading] = useState(false)

  async function updateStatus(next: 'qualified' | 'disqualified') {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualification_status: next }),
      })
      if (!res.ok) throw new Error('Erreur')
      setStatus(next)
      toast.success(next === 'qualified' ? 'Lead qualifié' : 'Lead disqualifié')
    } catch {
      toast.error('Impossible de mettre à jour le lead')
    } finally {
      setLoading(false)
    }
  }

  const name = lead.full_name ?? 'Contact sans nom'
  const barClass = STATUS_BAR[status]

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      {barClass && <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r ${barClass}`} />}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusDot tone={STATUS_TONE[status] ?? 'neutral'} label={STATUS_LABEL[status] ?? status} />
          {lead.score !== null && (
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              Score {lead.score}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(lead.id)}`}>
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {lead.phone ?? lead.email ?? 'Aucun contact'}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Target className="mt-0.5 size-3 shrink-0" />
          {lead.need_summary ?? 'Aucun résumé'}
          {lead.budget_range && ` · Budget ${lead.budget_range}`}
        </p>
      </div>

      {status === 'qualifying' && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={() => updateStatus('disqualified')}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" />
            Rejeter
          </button>
          <Button size="sm" variant="outline" onClick={() => updateStatus('qualified')} disabled={loading} className="h-7 gap-1.5 text-xs">
            <Check className="size-3.5" />
            Qualifier
          </Button>
        </div>
      )}
    </div>
  )
}
