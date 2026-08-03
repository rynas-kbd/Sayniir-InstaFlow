import { Target, Users, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { EmptyState } from '@/components/ui/empty-state'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { LeadRow, type Lead } from '@/components/workspace/lead-row'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { active } = await resolveActiveAccount()

  if (!active) {
    return <NoAccountState description="Connectez un compte Instagram, Messenger ou WhatsApp pour que l'IA qualifie vos prospects." />
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('channel_account_id', active.id)
    .order('created_at', { ascending: false })
  // Thrown, not swallowed — app/(app)/error.tsx now catches this and shows a
  // real error state instead of an indistinguishable "no leads yet" empty state.
  if (error) throw new Error('Impossible de charger les leads')

  const safeLeads = (leads ?? []) as Lead[]
  const qualifyingCount = safeLeads.filter((l) => l.qualification_status === 'qualifying').length
  const qualifiedCount = safeLeads.filter((l) => l.qualification_status === 'qualified').length

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Leads" description="Qualification automatique des prospects par l'IA." />
      <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {safeLeads.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
