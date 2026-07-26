import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import { checkFlowUnreachable } from '../../../../lib/ai/lint/rules/flow-unreachable'
import type { FlowNode, FlowEdge } from '../../../../lib/flows/types'

function node(node_key: string, type: FlowNode['type'] = 'send_message'): FlowNode {
  return { id: node_key, flow_id: 'f1', node_key, type, config: {} }
}

function edge(source_node_key: string, target_node_key: string, source_handle = 'default'): FlowEdge {
  return { id: `${source_node_key}->${target_node_key}`, source_node_key, target_node_key, source_handle }
}

describe('checkFlowUnreachable', () => {
  test('returns no findings when every node is reachable from the trigger', () => {
    const nodes = [node('n1', 'trigger'), node('n2'), node('n3')]
    const edges = [edge('n1', 'n2'), edge('n2', 'n3')]

    const findings = checkFlowUnreachable({ id: 'f1' }, nodes, edges)

    expect(findings).toEqual([])
  })

  test('flags a node with no path from the trigger', () => {
    const nodes = [node('n1', 'trigger'), node('n2'), node('orphan')]
    const edges = [edge('n1', 'n2')]

    const findings = checkFlowUnreachable({ id: 'f1' }, nodes, edges)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/unreachable', subjectId: 'f1:orphan', severity: 'error' })
  })

  test('returns no findings when there is no trigger node', () => {
    const nodes = [node('n1'), node('n2')]

    const findings = checkFlowUnreachable({ id: 'f1' }, nodes, [])

    expect(findings).toEqual([])
  })

  test('property: every node reachable from the trigger by a random forward graph is never flagged', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), (extraCount) => {
        // Build a chain trigger -> n1 -> n2 -> ... so every node is reachable by construction.
        const keys = ['trigger', ...Array.from({ length: extraCount }, (_, i) => `n${i}`)]
        const nodes = keys.map((k, i) => node(k, i === 0 ? 'trigger' : 'send_message'))
        const edges = keys.slice(1).map((k, i) => edge(keys[i], k))

        const findings = checkFlowUnreachable({ id: 'f1' }, nodes, edges)

        expect(findings).toEqual([])
      })
    )
  })
})
