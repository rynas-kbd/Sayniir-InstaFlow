import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FlowCanvas } from '@/components/flows/builder/flow-canvas'
import { FlowAnalyticsPopover } from '@/components/flows/builder/flow-analytics-popover'
import { GrowthLinkPopover } from '@/components/flows/builder/growth-link-popover'
import { getFlowFunnel } from '@/lib/flows/analytics'
import type { FlowNodeRecord, FlowEdgeRecord, FlowSummary } from '@/components/flows/types'
import type { FlowMeta } from '@/components/flows/builder/flow-canvas'
import { nodeKeyFromSubject } from '@/lib/ai/lint/types'
import { mapAiInsightRow, type AiInsight } from '@/components/ai/types'
import { InsightBadge } from '@/components/ai/insight-badge'

export default async function FlowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: flow } = await supabase.from('flows').select('*').eq('id', id).single()
  if (!flow) notFound()

  const [{ data: nodes }, { data: edges }, { data: tags }, { data: otherFlows }] = await Promise.all([
    supabase.from('flow_nodes').select('*').eq('flow_id', id),
    supabase.from('flow_edges').select('*').eq('flow_id', id),
    supabase.from('tags').select('*').eq('channel_account_id', flow.channel_account_id).order('name'),
    supabase
      .from('flows')
      .select('id, name, status, trigger_type, trigger_keywords, created_at')
      .eq('channel_account_id', flow.channel_account_id)
      .neq('id', id),
  ])

  const [funnel, { data: account }, { data: growthLinks }, { data: insightRows }] = await Promise.all([
    getFlowFunnel(id),
    supabase.from('channel_accounts').select('instagram_username').eq('id', flow.channel_account_id).single(),
    supabase.from('growth_links').select('*').eq('flow_id', id).order('created_at', { ascending: false }),
    supabase
      .from('ai_insights')
      .select('id, rule_id, scope, subject_id, severity, title, detail, fix_tool_name, fix_tool_input')
      .eq('channel_account_id', flow.channel_account_id)
      .eq('scope', 'flow')
      .is('dismissed_at', null)
      .or(`subject_id.eq.${id},subject_id.like.${id}:%`),
  ])

  const flowLevelInsights: AiInsight[] = []
  const insightsByNodeKey = new Map<string, AiInsight[]>()
  for (const row of insightRows ?? []) {
    const insight = mapAiInsightRow(row)
    const nodeKey = nodeKeyFromSubject(insight.subjectId)
    if (nodeKey === null) {
      flowLevelInsights.push(insight)
    } else {
      const list = insightsByNodeKey.get(nodeKey) ?? []
      list.push(insight)
      insightsByNodeKey.set(nodeKey, list)
    }
  }

  const flowMeta: FlowMeta = {
    id: flow.id,
    name: flow.name,
    trigger_type: flow.trigger_type,
    trigger_keywords: flow.trigger_keywords ?? null,
    target_post_ids: flow.target_post_ids ?? null,
    status: flow.status,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/flows" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Flows
        </Link>
        <span className="text-sm font-semibold text-foreground">{flow.name}</span>
        {flowLevelInsights.length > 0 && <InsightBadge insights={flowLevelInsights} />}
        <div className="ml-auto flex items-center gap-2">
          <GrowthLinkPopover
            channelAccountId={flow.channel_account_id}
            flowId={id}
            instagramUsername={account?.instagram_username ?? null}
            links={growthLinks ?? []}
          />
          <FlowAnalyticsPopover funnel={funnel} />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <FlowCanvas
          flow={flowMeta}
          initialNodes={(nodes ?? []) as FlowNodeRecord[]}
          initialEdges={(edges ?? []) as FlowEdgeRecord[]}
          tags={tags ?? []}
          otherFlows={(otherFlows ?? []) as FlowSummary[]}
          insightsByNodeKey={Object.fromEntries(insightsByNodeKey)}
        />
      </div>
    </div>
  )
}
