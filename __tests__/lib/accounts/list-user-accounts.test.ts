import { describe, test, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, type FakeSupabase } from '../../helpers/fake-supabase'

// active-account.ts is `import 'server-only'`-guarded (Next.js RSC only) —
// the package itself is a no-op outside Next's bundler, but plain Node
// (vitest) can't resolve it at all without this stub.
vi.mock('server-only', () => ({}))

/**
 * Regression coverage for listUserAccounts' RBAC extension (Palier E core)
 * — a team member must see accounts they have accepted access to, not just
 * accounts they own, or an invited login would land with an empty account
 * switcher and nothing to do.
 */

type FakeSupabaseWithAuth = FakeSupabase & { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } }

let fakeSupabase: FakeSupabaseWithAuth
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => fakeSupabase,
}))

// Imported AFTER the mock above is registered, per vitest's hoisting contract.
const { listUserAccounts } = await import('@/lib/accounts/active-account')

const ownedAccount = { id: 'acct-owned', platform: 'instagram', connected_at: '2026-01-01T00:00:00Z' }
const memberAccount = { id: 'acct-member', platform: 'messenger', connected_at: '2026-02-01T00:00:00Z' }

function makeAuthedFakeSupabase(userId: string | null): FakeSupabaseWithAuth {
  return { ...makeFakeSupabase(), auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) } }
}

beforeEach(() => {
  fakeSupabase = makeAuthedFakeSupabase('user-1')
})

describe('listUserAccounts', () => {
  test('returns an empty list when not authenticated', async () => {
    fakeSupabase = makeAuthedFakeSupabase(null)
    expect(await listUserAccounts()).toEqual([])
  })

  test('includes accounts reached via an accepted team membership, alongside owned accounts', async () => {
    fakeSupabase._bareOverrides.channel_accounts = [
      { data: [ownedAccount], error: null }, // owned accounts query
      { data: [memberAccount], error: null }, // accounts resolved from membership ids
    ]
    fakeSupabase._bareOverrides.team_members = [{ data: [{ channel_account_id: 'acct-member' }], error: null }]

    const result = await listUserAccounts()

    expect(result.map((a) => a.id)).toEqual(['acct-owned', 'acct-member'])
    // connected_at must never leak into the returned shape.
    expect(result.every((a) => !('connected_at' in a))).toBe(true)
  })

  test('does not query channel_accounts a second time when there is no accepted membership', async () => {
    fakeSupabase._bareOverrides.channel_accounts = [{ data: [ownedAccount], error: null }]
    fakeSupabase._bareOverrides.team_members = [{ data: [], error: null }]

    const result = await listUserAccounts()
    expect(result.map((a) => a.id)).toEqual(['acct-owned'])
  })
})
