import { describe, test, expect } from 'vitest'
import { appendTextDelta, appendToolResult, type AssistantPart } from '../../../lib/ai/copilot-message-parts'

describe('appendTextDelta', () => {
  test('starts a new text part when there are no parts yet', () => {
    expect(appendTextDelta([], 'Bonjour')).toEqual([{ type: 'text', text: 'Bonjour' }])
  })

  test('merges into the last part when it is already text', () => {
    const parts: AssistantPart[] = [{ type: 'text', text: 'Bon' }]
    expect(appendTextDelta(parts, 'jour')).toEqual([{ type: 'text', text: 'Bonjour' }])
  })

  test('starts a new text part after a tool_result rather than merging into it', () => {
    const parts: AssistantPart[] = [{ type: 'tool_result', name: 'list_flows', output: { flows: [] } }]
    expect(appendTextDelta(parts, 'Voici vos flows :')).toEqual([
      { type: 'tool_result', name: 'list_flows', output: { flows: [] } },
      { type: 'text', text: 'Voici vos flows :' },
    ])
  })

  test('does not mutate the input array', () => {
    const parts: AssistantPart[] = [{ type: 'text', text: 'a' }]
    const result = appendTextDelta(parts, 'b')
    expect(parts).toEqual([{ type: 'text', text: 'a' }])
    expect(result).not.toBe(parts)
  })
})

describe('appendToolResult', () => {
  test('always appends as a new part, even right after another text part', () => {
    const parts: AssistantPart[] = [{ type: 'text', text: 'Un instant, je regarde vos flows...' }]
    const result = appendToolResult(parts, 'list_flows', { flows: [{ id: '1', name: 'Bienvenue', status: 'active' }] })
    expect(result).toEqual([
      { type: 'text', text: 'Un instant, je regarde vos flows...' },
      { type: 'tool_result', name: 'list_flows', output: { flows: [{ id: '1', name: 'Bienvenue', status: 'active' }] } },
    ])
  })

  test('two consecutive tool results stay as two separate parts, never merged', () => {
    const withFirst = appendToolResult([], 'list_flows', { flows: [] })
    const withBoth = appendToolResult(withFirst, 'list_products', [])
    expect(withBoth).toEqual([
      { type: 'tool_result', name: 'list_flows', output: { flows: [] } },
      { type: 'tool_result', name: 'list_products', output: [] },
    ])
  })

  test('does not mutate the input array', () => {
    const parts: AssistantPart[] = []
    const result = appendToolResult(parts, 'list_flows', { flows: [] })
    expect(parts).toEqual([])
    expect(result).not.toBe(parts)
  })
})
