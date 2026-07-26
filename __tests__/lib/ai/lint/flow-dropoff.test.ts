import { describe, test, expect } from 'vitest'
import { checkFlowDropoff } from '../../../../lib/ai/lint/rules/flow-dropoff'
import type { FlowNode, FlowEdge } from '../../../../lib/flows/types'

function node(node_key: string): FlowNode {
  return { id: node_key, flow_id: 'f1', node_key, type: 'send_message', config: {} }
}

function edge(source_node_key: string, target_node_key: string): FlowEdge {
  return { id: `${source_node_key}->${target_node_key}`, source_node_key, target_node_key, source_handle: 'default' }
}

describe('checkFlowDropoff', () => {
  test('flags a node reached by fewer than 30% of its predecessor', () => {
    const nodes = [node('n1'), node('n2')]
    const edges = [edge('n1', 'n2')]

    const findings = checkFlowDropoff({ id: 'f1' }, nodes, edges, { n1: 100, n2: 20 })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/dropoff', subjectId: 'f1:n2', severity: 'info' })
  })

  test('returns no findings when reach stays above the threshold', () => {
    const nodes = [node('n1'), node('n2')]
    const edges = [edge('n1', 'n2')]

    expect(checkFlowDropoff({ id: 'f1' }, nodes, edges, { n1: 100, n2: 80 })).toEqual([])
  })

  test('ignores a steep drop when the predecessor sample is too small', () => {
    const nodes = [node('n1'), node('n2')]
    const edges = [edge('n1', 'n2')]

    expect(checkFlowDropoff({ id: 'f1' }, nodes, edges, { n1: 5, n2: 0 })).toEqual([])
  })

  test('ignores the trigger node with no incoming edge', () => {
    const nodes = [node('n1')]
    expect(checkFlowDropoff({ id: 'f1' }, nodes, [], { n1: 100 })).toEqual([])
  })
})
