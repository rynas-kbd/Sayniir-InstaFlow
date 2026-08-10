import type { ActiveAccount } from './active-account.ts'

/**
 * Pure selection logic, split out from active-account.ts so it can be unit
 * tested without mocking next/headers or the Supabase server client.
 *
 * `accounts` must already be scoped to the current user (as
 * listUserAccounts() guarantees) — that's what makes this safe: a
 * `requestedId` naming another user's account simply won't be found in the
 * list and falls back to `accounts[0]`, instead of resolving to it.
 */
export function selectActiveAccount(accounts: ActiveAccount[], requestedId: string | undefined): ActiveAccount | null {
  if (accounts.length === 0) return null
  return (requestedId && accounts.find((a) => a.id === requestedId)) || accounts[0]
}
