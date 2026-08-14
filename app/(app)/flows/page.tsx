import Link from 'next/link'
import { Workflow, Zap, TrendingUp, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { getAccountLabel } from '@/lib/channels/labels'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { Button } from '@/components/ui/button'
import { FlowCard } from '@/components/flows/flow-card'
import { FlowsEnabledToggle } from '@/components/flows/flows-enabled-toggle'
import type { FlowSummary } from '@/components/flows/types'
import { flowIdFromSubject } from '@/lib/ai/lint/types'
import { mapAiInsightRow, type AiInsight } from '@/components/ai/types'
import { getT } from '@/lib/i18n/server'
import type { Translator } from '@/lib/i18n/translate'

export default async function FlowsPage() {
  const supabase = await createClient()
  const { accounts, active: account, scope } = await resolveActiveAccount()
  const t = await getT()

  if (!account) {
    return <NoAccountState description={t('flows.page.noAccountDescription')} />
  }

  const accountIds = scope === 'all' ? accounts.map((a) => a.id) : [account.id]
  const accountNameMap = new Map(accounts.map((a) => [a.id, getAccountLabel(a)]))

  const [{ data: flows }, { data: settings }, { data: runsData }, { data: insightRows }] = await Promise.all([
    supabase.from('flows').select('*').in('channel_account_id', accountIds).order('created_at', { ascending: false }),
    supabase.from('agent_settings').select('flows_enabled').in('channel_account_id', accountIds),
    supabase.from('flow_runs').select('id, status').in('channel_account_id', accountIds),
    supabase
      .from('ai_insights')
      .select('id, rule_id, scope, subject_id, severity, title, detail, fix_tool_name, fix_tool_input')
      .in('channel_account_id', accountIds)
      .eq('scope', 'flow')
      .is('dismissed_at', null),
  ])

  const safeFlows = (flows ?? []) as (FlowSummary & { channel_account_id?: string })[]

  const { data: targetRows } = safeFlows.length
    ? await supabase.from('flow_target_accounts').select('flow_id, channel_account_id').in('flow_id', safeFlows.map((f) => f.id))
    : { data: [] as { flow_id: string; channel_account_id: string }[] }
  const targetAccountsByFlowId = new Map<string, string[]>()
  for (const row of targetRows ?? []) {
    const list = targetAccountsByFlowId.get(row.flow_id) ?? []
    list.push(row.channel_account_id)
    targetAccountsByFlowId.set(row.flow_id, list)
  }
  const activeCount = safeFlows.filter((f) => f.status === 'active').length
  const totalRuns = runsData?.length ?? 0
  const completedRuns = runsData?.filter((r) => r.status === 'completed').length ?? 0
  const flowsEnabled = settings?.some((s) => s.flows_enabled) ?? false

  const insightsByFlowId = new Map<string, AiInsight[]>()
  for (const row of insightRows ?? []) {
    const insight = mapAiInsightRow(row)
    const flowId = flowIdFromSubject(insight.subjectId)
    const list = insightsByFlowId.get(flowId) ?? []
    list.push(insight)
    insightsByFlowId.set(flowId, list)
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="glass-banner border-b border-border/40 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('flows.page.title')}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('flows.page.subtitle')}
            </p>
          </div>
          <Button render={<Link href="/flows/new" />}>
            <Plus className="size-4" />
            {t('flows.page.newFlow')}
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap gap-3">
          <StatPill icon={Workflow} label={t('flows.page.stats.created')} value={safeFlows.length} />
          <StatPill icon={Zap} label={t('flows.page.stats.active')} value={activeCount} highlight />
          <StatPill icon={TrendingUp} label={t('flows.page.stats.triggered')} value={totalRuns} />
          <StatPill icon={TrendingUp} label={t('flows.page.stats.completed')} value={completedRuns} />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6">
        {/* Flows enabled banner */}
        <FlowsEnabledToggle
          channelAccountId={account.id}
          initialEnabled={flowsEnabled}
        />

        <div className="mt-5">
          {safeFlows.length === 0 ? (
            <FlowsEmptyState t={t} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {safeFlows.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  accountName={flow.channel_account_id ? accountNameMap.get(flow.channel_account_id) ?? null : null}
                  insights={insightsByFlowId.get(flow.id) ?? []}
                  allAccounts={accounts}
                  initialTargetAccountIds={targetAccountsByFlowId.get(flow.id) ?? []}
                />
              ))}
              {/* Add new card */}
              <Link
                href="/flows/new"
                className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
                  <Plus className="size-5" />
                </div>
                <span className="text-sm font-medium">{t('flows.page.newFlow')}</span>
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

function FlowsEmptyState({ t }: { t: Translator }) {
  const tips = [
    { emoji: '💬', title: t('flows.page.emptyState.tips.message.title'), desc: t('flows.page.emptyState.tips.message.desc') },
    { emoji: '🔀', title: t('flows.page.emptyState.tips.conditions.title'), desc: t('flows.page.emptyState.tips.conditions.desc') },
    { emoji: '⏱️', title: t('flows.page.emptyState.tips.delays.title'), desc: t('flows.page.emptyState.tips.delays.desc') },
  ]

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Workflow className="size-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{t('flows.page.emptyState.title')}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {t('flows.page.emptyState.description')}
      </p>
      <div className="mt-6">
        <Button render={<Link href="/flows/new" />}>
          <Plus className="size-4" />
          {t('flows.page.newFlow')}
        </Button>
      </div>
      {/* Tips */}
      <div className="mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
        {tips.map((tip) => (
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
