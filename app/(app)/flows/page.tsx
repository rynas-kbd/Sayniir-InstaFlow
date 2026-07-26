import Link from 'next/link'
import { Workflow, Zap, TrendingUp, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { FlowCard } from '@/components/flows/flow-card'
import { FlowsEnabledToggle } from '@/components/flows/flows-enabled-toggle'
import type { FlowSummary } from '@/components/flows/types'
import { flowIdFromSubject } from '@/lib/ai/lint/types'
import { mapAiInsightRow, type AiInsight } from '@/components/ai/types'

export default async function FlowsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id, instagram_username, page_name, phone_number, platform')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: true })

  const account = accounts?.[0]
  const accountName = account
    ? account.platform === 'whatsapp'
      ? account.phone_number ?? null
      : `@${account.instagram_username ?? account.page_name ?? 'Compte'}`
    : null

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <EmptyState
            icon={Workflow}
            title="Aucun compte connecté"
            description="Connectez un compte Instagram pour créer des flows."
          />
        </div>
      </div>
    )
  }

  const [{ data: flows }, { data: settings }, { data: runsData }, { data: insightRows }] = await Promise.all([
    supabase.from('flows').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('agent_settings').select('flows_enabled').eq('channel_account_id', account.id).maybeSingle(),
    supabase.from('flow_runs').select('id, status').eq('channel_account_id', account.id),
    supabase
      .from('ai_insights')
      .select('id, rule_id, scope, subject_id, severity, title, detail, fix_tool_name, fix_tool_input')
      .eq('channel_account_id', account.id)
      .eq('scope', 'flow')
      .is('dismissed_at', null),
  ])

  const safeFlows = (flows ?? []) as FlowSummary[]
  const activeCount = safeFlows.filter((f) => f.status === 'active').length
  const totalRuns = runsData?.length ?? 0
  const completedRuns = runsData?.filter((r) => r.status === 'completed').length ?? 0

  const insightsByFlowId = new Map<string, AiInsight[]>()
  for (const row of insightRows ?? []) {
    const insight = mapAiInsightRow(row)
    const flowId = flowIdFromSubject(insight.subjectId)
    const list = insightsByFlowId.get(flowId) ?? []
    list.push(insight)
    insightsByFlowId.set(flowId, list)
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="glass-banner border-b border-border/40 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Flows</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Automatisez vos conversations avec des flux visuels intelligents.
            </p>
          </div>
          <Button render={<Link href="/flows/new" />}>
            <Plus className="size-4" />
            Nouveau flow
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap gap-3">
          <StatPill icon={Workflow} label="Flows créés" value={safeFlows.length} />
          <StatPill icon={Zap} label="Actifs" value={activeCount} highlight />
          <StatPill icon={TrendingUp} label="Déclenchements" value={totalRuns} />
          <StatPill icon={TrendingUp} label="Complétés" value={completedRuns} />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Flows enabled banner */}
        <FlowsEnabledToggle
          channelAccountId={account.id}
          initialEnabled={settings?.flows_enabled ?? false}
        />

        <div className="mt-5">
          {safeFlows.length === 0 ? (
            <FlowsEmptyState />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {safeFlows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} accountName={accountName} insights={insightsByFlowId.get(flow.id) ?? []} />
              ))}
              {/* Add new card */}
              <Link
                href="/flows/new"
                className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
                  <Plus className="size-5" />
                </div>
                <span className="text-sm font-medium">Nouveau flow</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${
        highlight
          ? 'border-primary/20 bg-primary/8 text-primary'
          : 'border-border bg-muted/50 text-muted-foreground'
      }`}
    >
      <Icon className="size-3.5" />
      <span className="font-medium">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  )
}

function FlowsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Workflow className="size-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Créez votre premier flow</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Les flows vous permettent d&apos;automatiser vos réponses avec des scénarios visuels :
        messages, conditions, délais et bien plus.
      </p>
      <div className="mt-6">
        <Button render={<Link href="/flows/new" />}>
          <Plus className="size-4" />
          Nouveau flow
        </Button>
      </div>
      {/* Tips */}
      <div className="mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
        {[
          { emoji: '💬', title: 'Message auto', desc: 'Répondez instantanément à tout message' },
          { emoji: '🔀', title: 'Conditions', desc: 'Adaptez le scénario selon les mots-clés' },
          { emoji: '⏱️', title: 'Délais', desc: 'Attendez avant d\'envoyer le message suivant' },
        ].map((tip) => (
          <div key={tip.title} className="glass-stat rounded-2xl p-3.5">
            <div className="text-xl">{tip.emoji}</div>
            <div className="mt-1.5 text-xs font-medium text-foreground">{tip.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{tip.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
