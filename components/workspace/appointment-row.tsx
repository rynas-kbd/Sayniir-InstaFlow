'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
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
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <CalendarClock className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{appointment.client_name}</span>
          <Badge variant={STATUS_VARIANT[status] ?? 'outline'}>{status}</Badge>
          {appointment.service_name && <span className="text-xs text-muted-foreground">{appointment.service_name}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {appointment.scheduled_at
            ? new Date(appointment.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
            : 'Créneau non confirmé'}{' '}
          · {appointment.duration_minutes} min
          {appointment.client_phone && ` · ${appointment.client_phone}`}
        </p>
      </div>
      {status === 'pending' && (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => updateStatus('confirmed')} disabled={loading}>
            <Check className="size-3.5" /> Confirmer
          </Button>
          <Button size="sm" variant="destructive" onClick={() => updateStatus('cancelled')} disabled={loading}>
            <X className="size-3.5" /> Annuler
          </Button>
        </div>
      )}
    </div>
  )
}
