import type { FlowNode, FlowEdge } from '@/lib/flows/types.ts'
import { nodeSubjectId, type LintFinding } from '../types.ts'

/** BFS from the trigger node; anything not reached is a dead branch. */
export function checkFlowUnreachable(flow: { id: string }, nodes: FlowNode[], edges: FlowEdge[]): LintFinding[] {
  const trigger = nodes.find((n) => n.type === 'trigger')
  if (!trigger) return []

  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const targets = adjacency.get(edge.source_node_key) ?? []
    targets.push(edge.target_node_key)
    adjacency.set(edge.source_node_key, targets)
  }

  const reached = new Set<string>([trigger.node_key])
  const queue = [trigger.node_key]
  while (queue.length > 0) {
    const key = queue.shift() as string
    for (const next of adjacency.get(key) ?? []) {
      if (!reached.has(next)) {
        reached.add(next)
        queue.push(next)
      }
    }
  }

  return nodes
    .filter((n) => n.type !== 'trigger' && !reached.has(n.node_key))
    .map((n) => ({
      ruleId: 'flow/unreachable',
      scope: 'flow' as const,
      subjectId: nodeSubjectId(flow.id, n.node_key),
      severity: 'error' as const,
      title: 'Ce nœud n\'est jamais atteint',
      detail: `Aucun chemin depuis le déclencheur ne mène au nœud "${n.node_key}".`,
      fixToolName: 'delete_flow_node',
      fixToolInput: { flowId: flow.id, nodeKey: n.node_key },
    }))
}
