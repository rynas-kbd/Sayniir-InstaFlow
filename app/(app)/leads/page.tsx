import { Target, Users, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { EmptyState } from '@/components/ui/empty-state'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LeadRow, type Lead } from '@/components/workspace/lead-row'
import { getT } from '@/lib/i18n/server'

export default async function LeadsPage() {
  const t = await getT()
  const supabase = await createClient()
  const { active } = await resolveActiveAccount()

  if (!active) {
    return <NoAccountState description={t('leads.page.noAccountDescription')} />
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('channel_account_id', active.id)
    .order('created_at', { ascending: false })
  // Thrown, not swallowed — app/(app)/error.tsx now catches this and shows a
  // real error state instead of an indistinguishable "no leads yet" empty state.
  if (error) throw new Error(t('leads.page.loadError'))

  const safeLeads = (leads ?? []) as Lead[]
  const qualifyingCount = safeLeads.filter((l) => l.qualification_status === 'qualifying').length
  const qualifiedCount = safeLeads.filter((l) => l.qualification_status === 'qualified').length

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t('leads.page.title')} description={t('leads.page.description')} />
      <div className="flex-1 space-y-5 p-4 md:p-6">
        {safeLeads.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard title={t('leads.page.statTotal')} value={safeLeads.length} icon={Users} />
            <StatCard title={t('leads.page.statQualifying')} value={qualifyingCount} icon={Clock} />
            <StatCard title={t('leads.page.statQualified')} value={qualifiedCount} icon={CheckCircle2} />
          </div>
        )}

        {safeLeads.length === 0 ? (
          <EmptyState
            icon={Target}
            title={t('leads.page.emptyTitle')}
            description={t('leads.page.emptyDescription')}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safeLeads.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
