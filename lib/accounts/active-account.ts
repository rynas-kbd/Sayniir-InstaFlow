import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server.ts'
import type { Platform } from '@/lib/channels/types.ts'
import { selectActiveAccount, resolveAccountScope, ALL_ACCOUNTS_SCOPE } from './select-active-account.ts'

/**
 * Cookie holding the id of the "active" channel account — the single
 * account every page in app/(app) scopes its data to, chosen via the
 * account switcher in the topbar. Not httpOnly-readable secrets, just a
 * UI preference — but still validated against the user's real accounts on
 * every read (see resolveActiveAccount) so a forged/stale value can never
 * leak another account's data.
 */
export const ACTIVE_ACCOUNT_COOKIE = 'mc_active_account'

export { ALL_ACCOUNTS_SCOPE } from './select-active-account.ts'

export interface ActiveAccount {
  id: string
  platform: Platform
  page_id: string | null
  page_name: string | null
  page_picture_url: string | null
  instagram_username: string | null
  phone_number: string | null
  is_active: boolean
}

const ACCOUNT_COLUMNS =
  'id, platform, page_id, page_name, page_picture_url, instagram_username, phone_number, is_active'

/**
 * All accounts the current user can work in, oldest first — the order used
 * everywhere in the app. Includes both owned accounts and accounts an
 * accepted team-member invite grants access to (see migration
 * 20260831_team_rbac.sql — channel_accounts itself stays owner-write-only,
 * but an accepted member can SELECT it, which is all this needs).
 */
export async function listUserAccounts(): Promise<ActiveAccount[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const withConnectedAt = `${ACCOUNT_COLUMNS}, connected_at`

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from('channel_accounts').select(withConnectedAt).eq('user_id', user.id),
    supabase.from('team_members').select('channel_account_id').eq('user_id', user.id).not('accepted_at', 'is', null),
  ])

  const memberAccountIds = (memberships ?? []).map((m) => m.channel_account_id as string)
  const { data: memberAccounts } = memberAccountIds.length
    ? await supabase.from('channel_accounts').select(withConnectedAt).in('id', memberAccountIds)
    : { data: [] as never[] }

  const byId = new Map<string, { connected_at: string | null } & ActiveAccount>()
  for (const row of [...(owned ?? []), ...(memberAccounts ?? [])]) {
    byId.set(row.id, row as { connected_at: string | null } & ActiveAccount)
  }

  return Array.from(byId.values())
    .sort((a, b) => (a.connected_at ?? '').localeCompare(b.connected_at ?? ''))
    .map((row) => {
      const { connected_at, ...account } = row
      void connected_at
      return account
    })
}

/**
 * Resolves the account every page should scope its queries to: the cookie
 * value if it still refers to one of the user's own accounts, otherwise the
 * first connected account, otherwise null (no account connected yet).
 *
 * The cookie is deliberately never trusted on its own — it's matched
 * against `accounts` (which is already scoped to `user_id = auth.uid()`),
 * so a forged cookie pointing at another user's account id simply falls
 * back to the default instead of resolving to that account.
 */
export async function resolveActiveAccount(): Promise<{
  accounts: ActiveAccount[]
  active: ActiveAccount | null
  /**
   * 'all' when the user picked "Tous les canaux" in the account switcher
   * (Phase 2 unified inbox) — `active` is still populated in that case
   * (falls back to the first account) so pages that don't yet know about
   * the 'all' scope keep working exactly as before.
   */
  scope: 'all' | 'single'
}> {
  const accounts = await listUserAccounts()
  const cookieStore = await cookies()
  const requestedId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value

  return { accounts, active: selectActiveAccount(accounts, requestedId), scope: resolveAccountScope(requestedId) }
}
