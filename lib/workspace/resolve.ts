import 'server-only'
import { createClient } from '@/lib/supabase/server.ts'
import { listUserAccounts, type ActiveAccount } from '../accounts/active-account.ts'

export interface Workspace {
  id: string
  ownerUserId: string
  name: string | null
  /** Boutique multi-account sync — see app/api/workspace/sync-settings and app/api/boutique/sync-now. */
  boutiqueSyncEnabled: boolean
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

  const [{ data: workspaceRow, error: workspaceError }, accounts] = await Promise.all([
    supabase.from('workspaces').select('id, owner_user_id, name, boutique_sync_enabled').eq('owner_user_id', user.id).maybeSingle(),
    listUserAccounts(),
  ])
  if (workspaceError) console.error('[resolveWorkspace] Failed to load workspace:', workspaceError)

  const workspace: Workspace | null = workspaceRow
    ? {
        id: workspaceRow.id,
        ownerUserId: workspaceRow.owner_user_id,
        name: workspaceRow.name,
        boutiqueSyncEnabled: workspaceRow.boutique_sync_enabled ?? false,
      }
    : null

  return { workspace, accounts }
}

/**
 * Sibling account ids within a workspace — deliberately NOT listUserAccounts()
 * (which also includes accounts the caller only has via a team invite,
 * owned by someone else). Boutique sync only ever touches accounts the
 * workspace owner actually owns, so an invited member can't use it to leak
 * their catalog into accounts they were never granted access to.
 */
export async function getWorkspaceAccountIds(workspaceId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('channel_accounts').select('id').eq('workspace_id', workspaceId)
  if (error) console.error('[getWorkspaceAccountIds] Failed to list workspace accounts:', error)
  return (data ?? []).map((row) => row.id as string)
}
