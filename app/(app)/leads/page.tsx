import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
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

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Leads" description="Qualification automatique des prospects par l'IA." />
      <div className="p-4 sm:p-6">
        {safeLeads.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-16 text-center shadow-sm">
            <Target className="mx-auto mb-3 size-8 text-muted-foreground/50" strokeWidth={1} />
            <p className="mb-1 text-sm font-medium text-foreground">Aucun lead</p>
            <p className="text-sm text-muted-foreground">Les prospects qualifiés par l&apos;IA apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {safeLeads.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
