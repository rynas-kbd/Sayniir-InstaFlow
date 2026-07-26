import { describe, test, expect } from 'vitest'
import { checkFlowAiReplyNoKey } from '../../../../lib/ai/lint/rules/flow-ai-reply-no-key'
import type { FlowNode } from '../../../../lib/flows/types'

function aiReplyNode(node_key: string): FlowNode {
  return { id: node_key, flow_id: 'f1', node_key, type: 'ai_reply', config: {} }
}

describe('checkFlowAiReplyNoKey', () => {
  test('flags an ai_reply node when no key resolves', () => {
    const findings = checkFlowAiReplyNoKey({ id: 'f1' }, [aiReplyNode('a1')], false)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'flow/ai-reply-no-key', subjectId: 'f1:a1', severity: 'error' })
  })

  test('returns no findings when a key resolves', () => {
    expect(checkFlowAiReplyNoKey({ id: 'f1' }, [aiReplyNode('a1')], true)).toEqual([])
  })

  test('returns no findings when there is no ai_reply node', () => {
    const other: FlowNode = { id: 'm1', flow_id: 'f1', node_key: 'm1', type: 'send_message', config: {} }
    expect(checkFlowAiReplyNoKey({ id: 'f1' }, [other], false)).toEqual([])
  })
})
