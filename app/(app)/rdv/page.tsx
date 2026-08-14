import { CalendarClock, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { EmptyState } from '@/components/ui/empty-state'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { AppointmentRow, type Appointment } from '@/components/workspace/appointment-row'
import { getT } from '@/lib/i18n/server'

export default async function RdvPage() {
  const t = await getT()
  const supabase = await createClient()
  const { active } = await resolveActiveAccount()

  if (!active) {
    return <NoAccountState description={t('rdv.page.noAccountDescription')} />
  }

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('channel_account_id', active.id)
    .order('scheduled_at', { ascending: true })
  if (error) throw new Error(t('rdv.page.loadError'))

  const safeAppointments = (appointments ?? []) as Appointment[]
  const pendingCount = safeAppointments.filter((a) => a.status === 'pending').length
  const confirmedCount = safeAppointments.filter((a) => a.status === 'confirmed').length

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t('rdv.page.title')} description={t('rdv.page.description')} />
      <div className="flex-1 space-y-5 p-4 md:p-6">
        {safeAppointments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard title={t('rdv.page.statTotal')} value={safeAppointments.length} icon={CalendarClock} />
            <StatCard title={t('rdv.page.statPending')} value={pendingCount} icon={Clock} />
            <StatCard title={t('rdv.page.statConfirmed')} value={confirmedCount} icon={CheckCircle2} />
          </div>
        )}

        {safeAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={t('rdv.page.emptyTitle')}
            description={t('rdv.page.emptyDescription')}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safeAppointments.map((a) => (
              <AppointmentRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
