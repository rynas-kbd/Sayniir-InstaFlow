import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { AgentChannel } from '@/lib/agent/messaging'
import { makeFakeSupabase, type FakeSupabase } from '../../helpers/fake-supabase'

/**
 * Regression coverage for checkConfidenceEscalation (Palier B.1) — the
 * confidence-based human handoff modeled on how Fin/Sierra/Decagon escalate:
 * two consecutive low-confidence AI turns for the same sender pause the bot
 * and hand off, instead of only ever escalating on an explicit "talk to a
 * human" request or a manual pause.
 */

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeSupabase,
}))

// Imported AFTER the mock above is registered, per vitest's hoisting contract.
const { checkConfidenceEscalation } = await import('@/lib/agent/confidence')

function makeChannel(): AgentChannel & { sendTextMock: ReturnType<typeof vi.fn> } {
  const sendTextMock = vi.fn(async () => ({ messageId: 'sent-1' }))
  return { sendTextMock, sendText: sendTextMock, sendCard: vi.fn(async () => null), sendTyping: vi.fn(async () => {}) }
}

beforeEach(() => {
  fakeSupabase = makeFakeSupabase()
})

describe('checkConfidenceEscalation', () => {
  test('confidence undefined does not touch contacts and never escalates', async () => {
    const channel = makeChannel()
    const result = await checkConfidenceEscalation('acct-1', 'sender-1', channel, undefined, 'ecommerce.qa', 'handoff text')

    expect(result).toBeNull()
    expect(channel.sendTextMock).not.toHaveBeenCalled()
    expect(fakeSupabase._updated.contacts ?? []).toEqual([])
  })

  test('confidence at or above the threshold resets the streak and does not escalate', async () => {
    const channel = makeChannel()
    const result = await checkConfidenceEscalation('acct-1', 'sender-1', channel, 0.9, 'ecommerce.qa', 'handoff text')

    expect(result).toBeNull()
    expect(channel.sendTextMock).not.toHaveBeenCalled()
    expect(fakeSupabase._updated.contacts).toContainEqual({ low_confidence_streak: 0 })
  })

  test('a first low-confidence turn increments the streak but does not escalate yet', async () => {
    fakeSupabase = makeFakeSupabase({ contacts: [{ data: { low_confidence_streak: 0 }, error: null }] })
    const channel = makeChannel()
    const result = await checkConfidenceEscalation('acct-1', 'sender-1', channel, 0.2, 'ecommerce.qa', 'handoff text')

    expect(result).toBeNull()
    expect(channel.sendTextMock).not.toHaveBeenCalled()
    expect(fakeSupabase._updated.contacts).toContainEqual({ low_confidence_streak: 1 })
  })

  test('a second consecutive low-confidence turn escalates: pauses the bot and sends the handoff text instead of the caller answering', async () => {
    fakeSupabase = makeFakeSupabase({ contacts: [{ data: { low_confidence_streak: 1 }, error: null }] })
    const channel = makeChannel()
    const result = await checkConfidenceEscalation('acct-1', 'sender-1', channel, 0.3, 'ecommerce.qa', 'handoff text')

    expect(result).toEqual({ status: 'replied', replyText: 'handoff text', route: 'ecommerce.qa.confidence_escalation' })
    expect(channel.sendTextMock).toHaveBeenCalledWith('handoff text', undefined)
    expect(fakeSupabase._updated.contacts).toContainEqual(
      expect.objectContaining({ bot_paused: true, low_confidence_streak: 0, bot_paused_at: expect.any(String) })
    )
  })
})
