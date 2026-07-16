import { Workflow } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateFlowDialog } from '@/components/flows/create-flow-dialog'
import { FlowRow } from '@/components/flows/flow-row'
import { FlowsEnabledToggle } from '@/components/flows/flows-enabled-toggle'
import type { FlowSummary } from '@/components/flows/types'

export default async function FlowsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: true })

  const account = accounts?.[0]

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Flows" description="Automatisations visuelles par flux de conversation." />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={Workflow}
            title="Aucun compte connecté"
            description="Connectez un compte pour créer des flows."
          />
        </div>
      </div>
    )
  }

  const [{ data: flows }, { data: settings }] = await Promise.all([
    supabase.from('flows').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('agent_settings').select('flows_enabled').eq('channel_account_id', account.id).maybeSingle(),
  ])

  const safeFlows = (flows ?? []) as FlowSummary[]

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Flows"
        description="Automatisations visuelles par flux de conversation."
        actions={<CreateFlowDialog channelAccountId={account.id} />}
      />
      <div className="flex-1 overflow-y-auto space-y-4 p-4 sm:p-6">
        <FlowsEnabledToggle channelAccountId={account.id} initialEnabled={settings?.flows_enabled ?? false} />

        {safeFlows.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Aucun flow"
            description="Créez votre premier flow pour automatiser une conversation."
          />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {safeFlows.map((flow) => (
              <FlowRow key={flow.id} flow={flow} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
