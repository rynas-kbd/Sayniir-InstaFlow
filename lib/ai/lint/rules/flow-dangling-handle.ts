import type { FlowNode, FlowEdge } from '@/lib/flows/types.ts'
import { nodeSubjectId, type LintFinding } from '../types.ts'

const REQUIRED_HANDLES: Record<string, string[]> = {
  condition: ['true', 'false'],
  split_test: ['a', 'b'],
}

/** A condition/split_test node must have an outgoing edge on every handle it can produce. */
export function checkFlowDanglingHandle(flow: { id: string }, nodes: FlowNode[], edges: FlowEdge[]): LintFinding[] {
  const findings: LintFinding[] = []

  for (const node of nodes) {
    const required = REQUIRED_HANDLES[node.type]
    if (!required) continue

    const outgoingHandles = new Set(
      edges.filter((e) => e.source_node_key === node.node_key).map((e) => e.source_handle)
    )
    const missing = required.filter((h) => !outgoingHandles.has(h))
    if (missing.length === 0) continue

    findings.push({
      ruleId: 'flow/dangling-handle',
      scope: 'flow',
      subjectId: nodeSubjectId(flow.id, node.node_key),
      severity: 'error',
      title: 'Une branche de ce nœud ne mène nulle part',
      detail: `Le nœud "${node.node_key}" n'a pas d'arête sortante pour : ${missing.join(', ')}.`,
      fixToolName: 'connect_flow_nodes',
      fixToolInput: { flowId: flow.id, nodeKey: node.node_key, missingHandles: missing },
    })
  }

  return findings
}
