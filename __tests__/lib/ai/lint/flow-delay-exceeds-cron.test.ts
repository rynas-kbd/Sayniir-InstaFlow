import { describe, test, expect } from 'vitest'
import { checkFlowDelayExceedsCron } from '../../../../lib/ai/lint/rules/flow-delay-exceeds-cron'
import type { FlowNode } from '../../../../lib/flows/types'

function delayNode(node_key: string, seconds: number): FlowNode {
  return { id: node_key, flow_id: 'f1', node_key, type: 'delay', config: { seconds } }
}

describe('checkFlowDelayExceedsCron', () => {
  test('returns no findings for a delay under 24h', () => {
    const findings = checkFlowDelayExceedsCron({ id: 'f1' }, [delayNode('d1', 3600)])
    expect(findings).toEqual([])
  })

  test('flags a delay over 24h', () => {
    const findings = checkFlowDelayExceedsCron({ id: 'f1' }, [delayNode('d1', 3 * 86400)])
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/delay-exceeds-cron', subjectId: 'f1:d1', severity: 'warning' })
  })

  test('ignores non-delay nodes', () => {
    const nonDelay: FlowNode = { id: 'm1', flow_id: 'f1', node_key: 'm1', type: 'send_message', config: { seconds: 999999 } }
    expect(checkFlowDelayExceedsCron({ id: 'f1' }, [nonDelay])).toEqual([])
  })
})
