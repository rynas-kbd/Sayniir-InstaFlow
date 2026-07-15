import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { AutomationClient } from '@/components/automation/automation-client'

export default async function AutomationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_name, phone_number, platform')
    .eq('user_id', user!.id)

  const safeAccounts = accounts ?? []
  const accountIds = safeAccounts.map((a) => a.id)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .in('channel_account_id', safeIds)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Règles" description="Réponses automatiques par mot-clé, DM et commentaires." />
      <AutomationClient accounts={safeAccounts} initialRules={rules ?? []} />
    </div>
  )
}
