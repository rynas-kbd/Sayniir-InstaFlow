import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FlowCanvas } from '@/components/flows/builder/flow-canvas'
import type { FlowNodeRecord, FlowEdgeRecord, FlowSummary } from '@/components/flows/types'
import type { FlowMeta } from '@/components/flows/builder/flow-canvas'

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
      </div>
      <div className="min-h-0 flex-1">
        <FlowCanvas
          flow={flowMeta}
          initialNodes={(nodes ?? []) as FlowNodeRecord[]}
          initialEdges={(edges ?? []) as FlowEdgeRecord[]}
          tags={tags ?? []}
          otherFlows={(otherFlows ?? []) as FlowSummary[]}
        />
      </div>
    </div>
  )
}
