import { Target, Users, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LeadRow, type Lead } from '@/components/workspace/lead-row'

export default async function LeadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase.from('channel_accounts').select('id').eq('user_id', user!.id)
  const accountIds = (accounts ?? []).map((a) => a.id)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .in('channel_account_id', safeIds)
    .order('created_at', { ascending: false })

  const safeLeads = (leads ?? []) as Lead[]
  const qualifyingCount = safeLeads.filter((l) => l.qualification_status === 'qualifying').length
  const qualifiedCount = safeLeads.filter((l) => l.qualification_status === 'qualified').length

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Leads" description="Qualification automatique des prospects par l'IA." />
      <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {safeLeads.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard title="Total leads" value={safeLeads.length} icon={Users} />
            <StatCard title="En qualification" value={qualifyingCount} icon={Clock} />
            <StatCard title="Qualifiés" value={qualifiedCount} icon={CheckCircle2} />
          </div>
        )}

        {safeLeads.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Aucun lead"
            description="Les prospects qualifiés par l'IA apparaîtront ici."
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
