'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'

export interface Appointment {
  id: string
  client_name: string
  client_phone: string | null
  service_name: string | null
  scheduled_at: string | null
  duration_minutes: number
  status: string
  notes: string | null
}

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'destructive',
  no_show: 'destructive',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
}

export function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const [status, setStatus] = useState(appointment.status)
  const [loading, setLoading] = useState(false)

  async function updateStatus(next: 'confirmed' | 'cancelled') {
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('Erreur')
      setStatus(next)
      toast.success(next === 'confirmed' ? 'Rendez-vous confirmé' : 'Rendez-vous annulé')
    } catch {
      toast.error('Impossible de mettre à jour le rendez-vous')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-[13px] font-medium text-foreground">{appointment.client_name}</span>
          <StatusDot tone={STATUS_TONE[status] ?? 'neutral'} label={STATUS_LABEL[status] ?? status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {appointment.scheduled_at
            ? new Date(appointment.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
            : 'Créneau non confirmé'}{' '}
          · {appointment.duration_minutes} min
          {appointment.service_name && ` · ${appointment.service_name}`}
          {appointment.client_phone && ` · ${appointment.client_phone}`}
        </p>
      </div>
      {status === 'pending' && (
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="outline" onClick={() => updateStatus('confirmed')} disabled={loading}>
            <Check className="size-3.5" /> Confirmer
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus('cancelled')}
            disabled={loading}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" /> Annuler
          </Button>
        </div>
      )}
    </div>
  )
}
