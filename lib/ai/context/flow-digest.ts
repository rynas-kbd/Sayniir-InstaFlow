import type { FlowNode, FlowEdge } from '../../flows/types'
import type { LintFinding } from '../lint/types'

const MAX_LABEL_LENGTH = 28

function nodeLabel(node: FlowNode): string {
  switch (node.type) {
    case 'trigger':
      return 'trigger'
    case 'send_message': {
      const text = (node.config.text as string) ?? ''
      return text ? `send_message "${truncate(text)}"` : 'send_message'
    }
    case 'condition': {
      const { field, operator, value } = node.config as { field?: string; operator?: string; value?: string }
      return field ? `condition ${field} ${operator ?? '=='} ${value ?? ''}` : 'condition'
    }
    case 'delay':
      return `delay ${node.config.seconds ?? '?'}s`
    case 'ai_reply':
      return 'ai_reply'
    case 'set_tag':
      return 'set_tag'
    case 'remove_tag':
      return 'remove_tag'
    case 'jump':
      return 'jump'
    case 'capture_input':
      return `capture_input ${node.config.variable_name ?? ''}`
    case 'external_request':
      return `external_request ${truncate(String(node.config.url ?? ''))}`
    case 'split_test':
      return `split_test ${node.config.percentage_a ?? 50}/${100 - Number(node.config.percentage_a ?? 50)}`
    default:
      return node.type
  }
}

function truncate(text: string): string {
  return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH)}…` : text
}

/**
 * Compresses a flow graph into a ~1-line-per-node digest instead of sending raw JSON —
 * ~450 tokens vs ~6000 for a 30-node flow, and the structural facts (reachability, dropoff)
 * are pre-computed by the lint engine rather than left for the model to infer. See
 * docs/AI_NATIVE_DESIGN.md §8.4.
 */
export function buildFlowDigest(
  flow: { name: string; status: string; trigger_type: string; trigger_keywords: string[] | null },
  nodes: FlowNode[],
  edges: FlowEdge[],
  runCount: number,
  reachByNodeKey: Record<string, number>,
  findings: LintFinding[]
): string {
  const outgoingByNode = new Map<string, FlowEdge[]>()
  for (const edge of edges) {
    const list = outgoingByNode.get(edge.source_node_key) ?? []
    list.push(edge)
    outgoingByNode.set(edge.source_node_key, list)
  }

  const triggerDesc =
    flow.trigger_type === 'keyword' || flow.trigger_type === 'comment_keyword'
      ? `${flow.trigger_type}(${(flow.trigger_keywords ?? []).join(',')})`
      : flow.trigger_type

  const header = `FLOW "${flow.name}" [${flow.status}] trigger=${triggerDesc} nodes=${nodes.length} runs=${runCount}`

  const lines = nodes.map((node) => {
    const outgoing = outgoingByNode.get(node.node_key) ?? []
    const target =
      outgoing.length === 0
        ? '(none)'
        : outgoing.map((e) => (e.source_handle === 'default' ? e.target_node_key : `${e.target_node_key}[${e.source_handle}]`)).join(' ')
    const reach = reachByNodeKey[node.node_key]
    const reachSuffix = reach !== undefined ? ` reached=${reach}` : ''
    return `${node.node_key} ${nodeLabel(node)} → ${target}${reachSuffix}`
  })

  const lintLine =
    findings.length > 0
      ? `LINT: ${findings.map((f) => `${f.ruleId}(${f.subjectId.split(':')[1] ?? f.subjectId})`).join(' · ')}`
      : ''

  return [header, ...lines, lintLine].filter(Boolean).join('\n')
}
