'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server.ts'
import { ACTIVE_ACCOUNT_COOKIE, ALL_ACCOUNTS_SCOPE, listUserAccounts } from './active-account.ts'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Sets the active channel account for the current user, or the sentinel
 * 'all' to switch to the unified cross-channel inbox (Phase 2). Ownership
 * is verified server-side before the cookie is written — the switcher UI
 * only ever offers the user's own accounts, but this action can be called
 * directly, so it re-checks rather than trusting the caller. 'all' is only
 * accepted when the user actually has more than one accessible account —
 * otherwise there's nothing to unify and it would just hide data.
 */
export async function setActiveAccount(accountId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  if (accountId === ALL_ACCOUNTS_SCOPE) {
    const accounts = await listUserAccounts()
    if (accounts.length <= 1) return
    await writeActiveAccountCookie(ALL_ACCOUNTS_SCOPE)
    return
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account) return

  await writeActiveAccountCookie(accountId)
}

async function writeActiveAccountCookie(value: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })

  revalidatePath('/', 'layout')
}
