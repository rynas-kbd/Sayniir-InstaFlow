'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'

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

  return (
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-[13px] font-medium text-foreground">{lead.full_name ?? 'Contact sans nom'}</span>
          <StatusDot tone={STATUS_TONE[status] ?? 'neutral'} label={STATUS_LABEL[status] ?? status} />
          {lead.score !== null && <span className="text-xs text-muted-foreground tabular-nums">Score {lead.score}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {lead.need_summary ?? 'Aucun résumé'}
          {lead.budget_range && ` · Budget ${lead.budget_range}`}
          {lead.phone && ` · ${lead.phone}`}
        </p>
      </div>
      {status === 'qualifying' && (
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="outline" onClick={() => updateStatus('qualified')} disabled={loading}>
            <Check className="size-3.5" /> Qualifier
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus('disqualified')}
            disabled={loading}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" /> Rejeter
          </Button>
        </div>
      )}
    </div>
  )
}
