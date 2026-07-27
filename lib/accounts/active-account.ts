import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Platform } from '@/lib/channels/types'
import { selectActiveAccount } from './select-active-account'

/**
 * Cookie holding the id of the "active" channel account — the single
 * account every page in app/(app) scopes its data to, chosen via the
 * account switcher in the topbar. Not httpOnly-readable secrets, just a
 * UI preference — but still validated against the user's real accounts on
 * every read (see resolveActiveAccount) so a forged/stale value can never
 * leak another account's data.
 */
export const ACTIVE_ACCOUNT_COOKIE = 'mc_active_account'

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

/** All of the current user's connected accounts, oldest first — the order used everywhere in the app. */
export async function listUserAccounts(): Promise<ActiveAccount[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('channel_accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('user_id', user.id)
    .order('connected_at', { ascending: true })

  return (data ?? []) as ActiveAccount[]
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
}> {
  const accounts = await listUserAccounts()
  const cookieStore = await cookies()
  const requestedId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value

  return { accounts, active: selectActiveAccount(accounts, requestedId) }
}
