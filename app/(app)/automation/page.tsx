import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { PageHeader } from '@/components/app-shell/page-header'
import { AutomationClient } from '@/components/automation/automation-client'

export default async function AutomationPage() {
  const supabase = await createClient()
  const { accounts, active } = await resolveActiveAccount()

  const { data: rules } = active
    ? await supabase.from('automation_rules').select('*').eq('channel_account_id', active.id).order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Règles" description="Réponses automatiques par mot-clé, DM et commentaires." />
      <div className="min-h-0 flex-1">
        <AutomationClient accounts={accounts} initialRules={rules ?? []} />
      </div>
    </div>
  )
}
