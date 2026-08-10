import { describe, test, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, type FakeSupabase } from '../../helpers/fake-supabase'

/**
 * Regression coverage for the bot auto-resume safety net (Palier E, scoped
 * down from full team/RBAC) — a contact paused past the threshold gets
 * un-paused automatically, on top of the existing manual toggle.
 */

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeSupabase,
}))

// Imported AFTER the mock above is registered, per vitest's hoisting contract.
const { runBotAutoResume } = await import('@/lib/contacts/bot-auto-resume')

beforeEach(() => {
  fakeSupabase = makeFakeSupabase()
})

describe('runBotAutoResume', () => {
  test('resumes contacts paused past the threshold and clears bot_paused_at', async () => {
    fakeSupabase._bareOverrides.contacts = [{ data: [{ id: 'c1' }, { id: 'c2' }], error: null }]

    const result = await runBotAutoResume(30)

    expect(result).toEqual({ resumed: 2 })
    expect(fakeSupabase._updated.contacts).toContainEqual({ bot_paused: false, bot_paused_at: null })
  })

  test('does nothing when no contact is stale enough', async () => {
    fakeSupabase._bareOverrides.contacts = [{ data: [], error: null }]

    const result = await runBotAutoResume(30)

    expect(result).toEqual({ resumed: 0 })
    expect(fakeSupabase._updated.contacts ?? []).toEqual([])
  })
})
