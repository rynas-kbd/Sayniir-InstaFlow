import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { getAccountLabel } from '@/lib/channels/labels'
import { PageHeader } from '@/components/app-shell/page-header'
import { AutomationClient } from '@/components/automation/automation-client'

export default async function AutomationPage() {
  const supabase = await createClient()
  const { accounts, active, scope } = await resolveActiveAccount()

  // 'Tous les canaux' — mirrors app/(app)/flows/page.tsx's pattern. This page
  // previously never read `scope` at all, so picking "Tous les canaux" in the
  // account switcher silently kept showing only the single active account's
  // rules.
  const accountIds = scope === 'all' ? accounts.map((a) => a.id) : active ? [active.id] : []
  const accountNameMap = new Map(accounts.map((a) => [a.id, getAccountLabel(a)]))

  const { data: rules } = accountIds.length
    ? await supabase.from('automation_rules').select('*').in('channel_account_id', accountIds).order('created_at', { ascending: false })
    : { data: [] }

  const safeRules = rules ?? []
  const { data: targetRows } = safeRules.length
    ? await supabase.from('rule_target_accounts').select('rule_id, channel_account_id').in('rule_id', safeRules.map((r) => r.id))
    : { data: [] as { rule_id: string; channel_account_id: string }[] }
  const targetAccountsByRuleId = new Map<string, string[]>()
  for (const row of targetRows ?? []) {
    const list = targetAccountsByRuleId.get(row.rule_id) ?? []
    list.push(row.channel_account_id)
    targetAccountsByRuleId.set(row.rule_id, list)
  }
  const rulesWithTargets = safeRules.map((r) => ({
    ...r,
    target_account_ids: targetAccountsByRuleId.get(r.id) ?? [],
    account_name: accountNameMap.get(r.channel_account_id) ?? null,
  }))

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Règles" description="Réponses automatiques par mot-clé, DM et commentaires." />
      <div className="min-h-0 flex-1">
        <AutomationClient accounts={accounts} initialRules={rulesWithTargets} />
      </div>
    </div>
  )
}
