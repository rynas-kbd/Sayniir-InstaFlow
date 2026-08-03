import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden } from '@/lib/api/errors'
import type { NextResponse } from 'next/server'

export interface AuthedRequest {
  supabase: SupabaseClient
  user: User
}

/**
 * Collapses the ~60-copy inline pattern (`createClient()` + `auth.getUser()` +
 * 401 on missing user) into one call. Returns a `NextResponse` directly when
 * unauthenticated so route handlers can `return` it without a second check:
 *
 *   const auth = await requireUser()
 *   if (auth instanceof Response) return auth
 *   const { supabase, user } = auth
 */
export async function requireUser(): Promise<AuthedRequest | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return unauthorized()
  return { supabase, user }
}

/**
 * Verifies the given channel_accounts.id belongs to userId. This is the
 * ownership hop that RLS alone does not replace for resources reached via a
 * foreign key the caller supplies (see docs/SECURITY_AUDIT.md follow-up) —
 * always call this before trusting a client-supplied account/flow/etc id
 * that gets written into another table.
 */
export async function requireAccountOwnership(
  supabase: SupabaseClient,
  accountId: string,
  userId: string
): Promise<true | NextResponse> {
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()
  if (!account) return forbidden()
  return true
}

/**
 * Same ownership check for a flow, via its owning channel_account — the
 * join pattern already used correctly in app/api/flows/[id]/graph/route.ts.
 * Use this anywhere a client-supplied flow_id is written into another table
 * (e.g. growth_links) so a foreign tenant's flow can't be referenced.
 */
export async function requireFlowOwnership(
  supabase: SupabaseClient,
  flowId: string,
  userId: string
): Promise<true | NextResponse> {
  const { data: flow } = await supabase
    .from('flows')
    .select('id, channel_accounts!inner(user_id)')
    .eq('id', flowId)
    .eq('channel_accounts.user_id', userId)
    .single()
  if (!flow) return forbidden()
  return true
}
