import { createAdminClient } from '../supabase/admin'

export interface FlowNodeFunnelRow {
  node_key: string
  node_type: string
  reached: number
}

export interface FlowFunnelSummary {
  totalRuns: number
  completed: number
  active: number
  failed: number
  nodes: FlowNodeFunnelRow[]
}

/** Per-node "reached" counts + overall run status breakdown for one flow. */
export async function getFlowFunnel(flowId: string): Promise<FlowFunnelSummary> {
  const supabase = createAdminClient()

  const [{ data: nodes }, { data: events }, { data: runs }] = await Promise.all([
    supabase.from('flow_nodes').select('node_key, type').eq('flow_id', flowId),
    supabase.from('flow_node_events').select('node_key').eq('flow_id', flowId),
    supabase.from('flow_runs').select('status').eq('flow_id', flowId),
  ])

  const countByNode = new Map<string, number>()
  for (const e of events ?? []) {
    countByNode.set(e.node_key, (countByNode.get(e.node_key) ?? 0) + 1)
  }

  const nodeOrder = new Map((nodes ?? []).map((n, i) => [n.node_key, i]))
  const nodeRows: FlowNodeFunnelRow[] = (nodes ?? [])
    .map((n) => ({ node_key: n.node_key, node_type: n.type, reached: countByNode.get(n.node_key) ?? 0 }))
    .sort((a, b) => (nodeOrder.get(a.node_key) ?? 0) - (nodeOrder.get(b.node_key) ?? 0))

  const totalRuns = runs?.length ?? 0
  const completed = (runs ?? []).filter((r) => r.status === 'completed').length
  const active = (runs ?? []).filter((r) => r.status === 'active' || r.status === 'waiting').length
  const failed = (runs ?? []).filter((r) => r.status === 'failed').length

  return { totalRuns, completed, active, failed, nodes: nodeRows }
}
