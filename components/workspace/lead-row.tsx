'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Target, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  qualifying: 'outline',
  qualified: 'default',
  disqualified: 'destructive',
  booked: 'default',
  lost: 'destructive',
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
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Target className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{lead.full_name ?? 'Contact sans nom'}</span>
          <Badge variant={STATUS_VARIANT[status] ?? 'outline'}>{status}</Badge>
          {lead.score !== null && <span className="text-xs text-muted-foreground">Score {lead.score}</span>}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {lead.need_summary ?? 'Aucun résumé'}
          {lead.budget_range && ` · Budget ${lead.budget_range}`}
          {lead.phone && ` · ${lead.phone}`}
        </p>
      </div>
      {status === 'qualifying' && (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => updateStatus('qualified')} disabled={loading}>
            <Check className="size-3.5" /> Qualifier
          </Button>
          <Button size="sm" variant="destructive" onClick={() => updateStatus('disqualified')} disabled={loading}>
            <X className="size-3.5" /> Rejeter
          </Button>
        </div>
      )}
    </div>
  )
}
