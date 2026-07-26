import { describe, test, expect } from 'vitest'
import { checkFlowDanglingHandle } from '../../../../lib/ai/lint/rules/flow-dangling-handle'
import type { FlowNode, FlowEdge } from '../../../../lib/flows/types'

function node(node_key: string, type: FlowNode['type']): FlowNode {
  return { id: node_key, flow_id: 'f1', node_key, type, config: {} }
}

function edge(source_node_key: string, target_node_key: string, source_handle: string): FlowEdge {
  return { id: `${source_node_key}->${target_node_key}:${source_handle}`, source_node_key, target_node_key, source_handle }
}

describe('checkFlowDanglingHandle', () => {
  test('returns no findings when a condition node has both true and false edges', () => {
    const nodes = [node('c1', 'condition')]
    const edges = [edge('c1', 'a', 'true'), edge('c1', 'b', 'false')]

    expect(checkFlowDanglingHandle({ id: 'f1' }, nodes, edges)).toEqual([])
  })

  test('flags a condition node missing the false handle', () => {
    const nodes = [node('c1', 'condition')]
    const edges = [edge('c1', 'a', 'true')]

    const findings = checkFlowDanglingHandle({ id: 'f1' }, nodes, edges)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/dangling-handle', subjectId: 'f1:c1' })
    expect(findings[0].detail).toContain('false')
  })

  test('flags a split_test node missing the b handle', () => {
    const nodes = [node('s1', 'split_test')]
    const edges = [edge('s1', 'a', 'a')]

    const findings = checkFlowDanglingHandle({ id: 'f1' }, nodes, edges)

    expect(findings).toHaveLength(1)
    expect(findings[0].detail).toContain('b')
  })

  test('ignores node types with no required handles', () => {
    const nodes = [node('m1', 'send_message')]

    expect(checkFlowDanglingHandle({ id: 'f1' }, nodes, [])).toEqual([])
  })
})
