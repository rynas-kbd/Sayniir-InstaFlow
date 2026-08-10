import type { FlowNode, FlowEdge } from '@/lib/flows/types.ts'
import { nodeSubjectId, type LintFinding } from '../types.ts'

const DROPOFF_RATIO = 0.3
const MIN_PREDECESSOR_REACH = 10

/** A node reached by far fewer runs than its predecessor is a funnel friction point. */
export function checkFlowDropoff(
  flow: { id: string },
  nodes: FlowNode[],
  edges: FlowEdge[],
  reachByNodeKey: Record<string, number>
): LintFinding[] {
  const findings: LintFinding[] = []
  const nodeByKey = new Map(nodes.map((n) => [n.node_key, n]))

  for (const node of nodes) {
    const incoming = edges.filter((e) => e.target_node_key === node.node_key)
    if (incoming.length === 0) continue

    const predecessorReach = Math.max(...incoming.map((e) => reachByNodeKey[e.source_node_key] ?? 0))
    if (predecessorReach < MIN_PREDECESSOR_REACH) continue

    const reach = reachByNodeKey[node.node_key] ?? 0
    if (reach >= predecessorReach * DROPOFF_RATIO) continue

    const predecessorKey = incoming.find((e) => (reachByNodeKey[e.source_node_key] ?? 0) === predecessorReach)?.source_node_key
    const predecessor = predecessorKey ? nodeByKey.get(predecessorKey) : undefined
    const dropPct = Math.round((1 - reach / predecessorReach) * 100)

    findings.push({
      ruleId: 'flow/dropoff',
      scope: 'flow',
      subjectId: nodeSubjectId(flow.id, node.node_key),
      severity: 'info',
      title: 'Point de friction détecté dans le funnel',
      detail: `"${predecessor?.node_key ?? predecessorKey}" → "${node.node_key}" : ${dropPct}% des contacts n'atteignent pas ce nœud.`,
    })
  }

  return findings
}
