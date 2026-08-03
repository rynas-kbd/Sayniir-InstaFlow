import { describe, expect, test } from 'vitest'
import { evictOldHistory } from '@/lib/ai/loop'
import type { CanonicalMessage } from '@/lib/ai/providers/types'

function userTurn(text: string, replySize: number): CanonicalMessage[] {
  return [
    { role: 'user', content: text },
    { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(replySize) }] },
  ]
}

describe('evictOldHistory', () => {
  test('keeps history untouched when under the token budget', () => {
    const messages = userTurn('bonjour', 20)
    expect(evictOldHistory(messages)).toEqual(messages)
  })

  test('drops whole oldest turns once over budget, keeping the most recent turn', () => {
    // Each turn's assistant reply is ~80k chars (~20k tokens) — three turns
    // (~60k tokens) comfortably exceed MAX_HISTORY_TOKENS (40000).
    const turn1 = userTurn('premier message', 80_000)
    const turn2 = userTurn('deuxième message', 80_000)
    const turn3 = userTurn('dernier message', 80_000)
    const history = [...turn1, ...turn2, ...turn3]

    const result = evictOldHistory(history)

    // The oldest turn(s) must be gone, but the last turn is always kept.
    expect(result.some((m) => m.content === 'dernier message')).toBe(true)
    expect(result.length).toBeLessThan(history.length)
  })

  test('never drops the last turn even if it alone exceeds the budget', () => {
    const history = userTurn('seul message', 1_000_000)
    const result = evictOldHistory(history)
    expect(result).toEqual(history)
  })

  test('does not mistake a tool_result "user" message (array content) for a turn boundary', () => {
    // DB role 'tool' is mapped to canonical role 'user' with array content
    // (see toCanonicalRole in loop.ts) — evictOldHistory must not treat that
    // as a fresh turn start, or it could split a tool_use/tool_result pair.
    const history: CanonicalMessage[] = [
      { role: 'user', content: 'message texte' },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'list_flows', input: {} }] },
      { role: 'user', content: [{ type: 'tool_result', toolUseId: 't1', content: '[]' }] },
    ]
    expect(evictOldHistory(history)).toEqual(history)
  })
})
