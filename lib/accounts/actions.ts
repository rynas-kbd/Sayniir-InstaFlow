'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server.ts'
import { ACTIVE_ACCOUNT_COOKIE } from './active-account.ts'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Sets the active channel account for the current user. Ownership is
 * verified server-side before the cookie is written — the switcher UI only
 * ever offers the user's own accounts, but this action can be called
 * directly, so it re-checks rather than trusting the caller.
 */
export async function setActiveAccount(accountId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account) return

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, accountId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })

  revalidatePath('/', 'layout')
}
