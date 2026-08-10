import 'server-only'
import { createClient } from '@/lib/supabase/server.ts'
import { listUserAccounts, type ActiveAccount } from '../accounts/active-account.ts'

export interface Workspace {
  id: string
  ownerUserId: string
  name: string | null
}

export interface ResolvedWorkspace {
  /**
   * The signed-in user's own workspace — null only when logged out. Every
   * profile has exactly one, created at signup (handle_new_user()) and
   * backfilled for pre-existing users by 20260901000000_workspaces.sql.
   */
  workspace: Workspace | null
  /**
   * Every channel account the user can work in: owned accounts plus
   * accounts they hold an accepted team invite on (see listUserAccounts()).
   * An invited member's accounts can belong to a DIFFERENT owner's
   * workspace than their own — so cross-channel scoping (the unified
   * inbox, Phase 2) filters by this account list, never by a single
   * resolved workspace id. `workspace` above is for display (name, own
   * settings), not for data scoping.
   */
  accounts: ActiveAccount[]
}

/**
 * Resolves the current user's own workspace plus the full set of channel
 * accounts they can read/write across (their own + accepted team
 * memberships). Callers that need to scope a query across every connected
 * channel — e.g. the unified inbox — should filter by
 * `accounts.map(a => a.id)`, not by `workspace.id`.
 */
export async function resolveWorkspace(): Promise<ResolvedWorkspace> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { workspace: null, accounts: [] }

  const [{ data: workspaceRow }, accounts] = await Promise.all([
    supabase.from('workspaces').select('id, owner_user_id, name').eq('owner_user_id', user.id).maybeSingle(),
    listUserAccounts(),
  ])

  const workspace: Workspace | null = workspaceRow
    ? { id: workspaceRow.id, ownerUserId: workspaceRow.owner_user_id, name: workspaceRow.name }
    : null

  return { workspace, accounts }
}
