'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'

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
const STATUS_BAR: Record<string, string> = {
  confirmed: 'from-success/60 via-success to-success/60',
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

  const barClass = STATUS_BAR[status]

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      {barClass && <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r ${barClass}`} />}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusDot tone={STATUS_TONE[status] ?? 'neutral'} label={STATUS_LABEL[status] ?? status} />
          {appointment.service_name && (
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {appointment.service_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(appointment.id)}`}
          >
            {getInitials(appointment.client_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{appointment.client_name}</h3>
            <p className="truncate text-xs text-muted-foreground">{appointment.client_phone ?? 'Aucun numéro'}</p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3 shrink-0" />
          {appointment.scheduled_at
            ? new Date(appointment.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
            : 'Créneau non confirmé'}{' '}
          · {appointment.duration_minutes} min
        </p>
      </div>

      {status === 'pending' && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" />
            Annuler
          </button>
          <Button size="sm" variant="outline" onClick={() => updateStatus('confirmed')} disabled={loading} className="h-7 gap-1.5 text-xs">
            <Check className="size-3.5" />
            Confirmer
          </Button>
        </div>
      )}
    </div>
  )
}
