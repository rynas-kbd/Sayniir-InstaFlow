import { describe, test, expect, vi, beforeEach } from 'vitest'
import { TokenExpiredError } from '@/lib/meta/messaging'
import { makeFakeSupabase, type FakeSupabase } from '../../../helpers/fake-supabase'

/**
 * Regression coverage for runCartRecoverySweep — the abandoned-cart
 * recovery job (Palier A). Pins down: only Instagram/Messenger accounts are
 * reminded (WhatsApp has no template-message support yet), a session is
 * reminded at most once, a token failure deactivates the account without
 * crashing the sweep for other sessions, and a session that went unanswered
 * past the reminder gets expired instead of lingering as "in progress".
 */

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeSupabase,
}))

interface QuickReply {
  title: string
  payload: string
}
const sendMessage = vi.fn<(ref: unknown, recipientId: string, text: string, quickReplies?: QuickReply[]) => Promise<{ messageId: string }>>(
  async () => ({ messageId: 'sent-1' })
)
const getAdapter = vi.fn(() => ({ sendMessage }))
vi.mock('@/lib/channels/registry', () => ({
  getAdapter: () => getAdapter(),
}))

vi.mock('@/lib/channels/shared/tokens', () => ({
  resolveAccessToken: async (token: string) => token,
}))

// Imported AFTER the mocks above are registered, per vitest's hoisting contract.
const { runCartRecoverySweep } = await import('@/lib/agent/ecommerce/cart-recovery')

const igAccount = {
  id: 'acct-ig',
  platform: 'instagram',
  access_token: 'tok',
  page_id: null,
  phone_number_id: null,
  instagram_business_id: 'ig-biz-1',
  is_active: true,
}

function abandonedSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    channel_account_id: 'acct-ig',
    sender_id: 'sender-1',
    status: 'gathering_info',
    reminder_count: 0,
    detected_language: 'fr',
    products: { name: 'T-shirt Sasuke' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  sendMessage.mockResolvedValue({ messageId: 'sent-1' })
})

// The fake's bare-await queue is shared across every non-.maybeSingle()/
// .single() call on a table, in call order — a reminder's own
// order_sessions.update() consumes a queue slot exactly like a select
// would. Tests below only pre-queue what a later read actually depends on;
// anything consumed by an update whose return value the code never reads
// is left to the harmless empty-queue default.
describe('runCartRecoverySweep — reminders', () => {
  test('sends one reminder for an eligible session and records it', async () => {
    fakeSupabase = makeFakeSupabase()
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [igAccount], error: null }]
    fakeSupabase._bareOverrides.order_sessions = [{ data: [abandonedSession()], error: null }] // candidates query

    const result = await runCartRecoverySweep()

    expect(sendMessage).toHaveBeenCalledTimes(1)
    const [, recipientId, text, quickReplies] = sendMessage.mock.calls[0]
    expect(recipientId).toBe('sender-1')
    expect(text).toContain('T-shirt Sasuke')
    expect(quickReplies).toEqual([{ title: 'Oui', payload: 'oui' }])

    expect(fakeSupabase._updated.order_sessions).toContainEqual(
      expect.objectContaining({ reminder_count: 1 })
    )
    expect(result).toEqual({ reminded: 1, expired: 0, skipped: 0 })
  })

  test('a session whose channel_account_id has no matching (non-WhatsApp, active) account is skipped', async () => {
    fakeSupabase = makeFakeSupabase()
    // A real account exists, but it's a DIFFERENT id than the candidate
    // session below points to — e.g. the session's account was since
    // deactivated or is on WhatsApp and was excluded upstream.
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [igAccount], error: null }]
    fakeSupabase._bareOverrides.order_sessions = [
      { data: [abandonedSession({ channel_account_id: 'acct-unrelated' })], error: null },
    ]

    const result = await runCartRecoverySweep()

    expect(sendMessage).not.toHaveBeenCalled()
    expect(result).toEqual({ reminded: 0, expired: 0, skipped: 1 })
  })

  test('a send failure due to an expired token deactivates the account and does not crash the sweep', async () => {
    sendMessage.mockRejectedValue(new TokenExpiredError('expired'))
    fakeSupabase = makeFakeSupabase()
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [igAccount], error: null }]
    fakeSupabase._bareOverrides.order_sessions = [{ data: [abandonedSession()], error: null }]

    const result = await runCartRecoverySweep()

    expect(result).toEqual({ reminded: 0, expired: 0, skipped: 1 })
    expect(fakeSupabase._updated.channel_accounts).toContainEqual(expect.objectContaining({ is_active: false }))
    // No order_sessions.reminder_count write for a failed send.
    expect(fakeSupabase._updated.order_sessions ?? []).toEqual([])
  })

  test('a session with no product picked yet still gets a (generic) reminder', async () => {
    fakeSupabase = makeFakeSupabase()
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [igAccount], error: null }]
    fakeSupabase._bareOverrides.order_sessions = [
      { data: [abandonedSession({ status: 'selecting_product', products: null })], error: null },
    ]

    await runCartRecoverySweep()

    const [, , text] = sendMessage.mock.calls[0]
    expect(text).not.toContain('null')
    expect(text.length).toBeGreaterThan(0)
  })
})

describe('runCartRecoverySweep — expiration', () => {
  test('expires (cancels) sessions that went unanswered past the reminder window', async () => {
    fakeSupabase = makeFakeSupabase()
    // No eligible accounts → the reminder pass is skipped entirely, so the
    // stale-sessions query below is the only bare await on order_sessions
    // in this run (see the queue-ordering note above).
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [], error: null }]
    fakeSupabase._bareOverrides.order_sessions = [
      { data: [{ id: 'sess-stale-1' }, { id: 'sess-stale-2' }], error: null }, // stale, already-reminded sessions
    ]

    const result = await runCartRecoverySweep()

    expect(fakeSupabase._updated.order_sessions).toContainEqual({ status: 'cancelled' })
    expect(result).toEqual({ reminded: 0, expired: 2, skipped: 0 })
  })
})
