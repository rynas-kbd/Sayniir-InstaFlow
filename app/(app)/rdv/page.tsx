import { CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { AppointmentRow, type Appointment } from '@/components/workspace/appointment-row'

export default async function RdvPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase.from('channel_accounts').select('id').eq('user_id', user!.id)
  const accountIds = (accounts ?? []).map((a) => a.id)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .in('channel_account_id', safeIds)
    .order('scheduled_at', { ascending: true })

  const safeAppointments = (appointments ?? []) as Appointment[]

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Rendez-vous" description="Prises de rendez-vous automatisées par l'IA." />
      <div className="p-4 md:p-6">
        {safeAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Aucun rendez-vous"
            description="Les rendez-vous pris par l'IA apparaîtront ici."
          />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {safeAppointments.map((a) => (
              <AppointmentRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
