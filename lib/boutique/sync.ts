import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Boutique multi-account sync — when a workspace has `boutique_sync_enabled`
 * (see migration 20260903000000 and app/api/workspace/sync-settings), every
 * agent_settings/product write on one of the owner's accounts is mirrored
 * onto every other account in the same workspace. Deliberately scoped to
 * `channel_accounts.workspace_id`, not listUserAccounts() — see
 * lib/workspace/resolve.ts::getWorkspaceAccountIds for why team-shared
 * accounts are excluded.
 *
 * app/api/boutique/sync-now/route.ts is the one-shot catch-up version of
 * the same logic, for turning sync on after accounts have already diverged.
 *
 * Every Supabase call here checks `error` and logs it — a prior version
 * discarded every one of them (`const { data } = await supabase...`), which
 * turned real failures (RLS denial, a bad column, a network blip) into the
 * exact same silent no-op as "sync is off" or "no siblings". That made a
 * genuine bug indistinguishable from expected behavior; see also the
 * callers in app/api/products/**, which used to fire this from `after()`
 * (best-effort, not guaranteed to run to completion on serverless) instead
 * of awaiting it inline before the response — switched to a direct await.
 */

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Sibling account ids to propagate to, or [] if this account's workspace has sync off (or no workspace/siblings). */
export async function resolveSyncTargets(supabase: SupabaseClient, sourceAccountId: string): Promise<string[]> {
  const { data: account, error: accountError } = await supabase.from('channel_accounts').select('workspace_id').eq('id', sourceAccountId).maybeSingle()
  if (accountError) {
    console.error('[boutique-sync] Failed to resolve source account workspace:', accountError)
    return []
  }
  if (!account?.workspace_id) return []

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('boutique_sync_enabled')
    .eq('id', account.workspace_id)
    .maybeSingle()
  if (workspaceError) {
    console.error('[boutique-sync] Failed to read workspace sync setting:', workspaceError)
    return []
  }
  if (!workspace?.boutique_sync_enabled) return []

  const { data: siblings, error: siblingsError } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('workspace_id', account.workspace_id)
    .neq('id', sourceAccountId)
  if (siblingsError) {
    console.error('[boutique-sync] Failed to list sibling accounts:', siblingsError)
    return []
  }
  return (siblings ?? []).map((s) => s.id as string)
}

/** Every agent_settings column worth mirroring — everything except the PK itself. */
const AGENT_SETTINGS_SYNC_COLUMNS = [
  'is_active',
  'is_qa_active',
  'is_order_taking_active',
  'is_availability_check_active',
  'instructions',
  'infos_to_collect',
  'ai_provider',
  // ai_api_key is included on purpose — the plan's explicit decision is to
  // keep AI behavior identical across every account, secret included.
  'ai_api_key',
  'ai_model',
  'default_message_enabled',
  'default_message_text',
  'default_message_frequency',
  'vertical_config',
  'flows_enabled',
]

export async function propagateAgentSettings(supabase: SupabaseClient, sourceAccountId: string, settings: Record<string, unknown>): Promise<void> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return

  const patch: Record<string, unknown> = {}
  for (const col of AGENT_SETTINGS_SYNC_COLUMNS) {
    if (col in settings) patch[col] = settings[col]
  }
  if (Object.keys(patch).length === 0) return

  const results = await Promise.all(
    targets.map((channel_account_id) => supabase.from('agent_settings').upsert({ channel_account_id, ...patch, updated_at: new Date().toISOString() }))
  )
  for (const { error } of results) {
    if (error) console.error('[boutique-sync] Failed to propagate agent_settings to a sibling account:', error)
  }
}

interface SyncableProduct {
  name: string
  description: string | null
  price: number
  currency: string
  kind: string
  sizes: string[]
  colors: string[]
  image_url: string | null
  images: string[]
  category: string | null
  metadata: Record<string, unknown>
  track_stock: boolean
  stock_quantity: number
  is_active: boolean
}

/**
 * Create-or-update by name on every sibling — mirrors app/api/products/sync-sheet/route.ts's
 * existing match-by-name convention, since products have no cross-account id relationship.
 *
 * @param previousName — the product's name BEFORE this write, when it's a
 * rename (see app/api/products/[id]/route.ts). Matching by the current name
 * alone would miss the sibling's copy after a rename and insert a
 * duplicate instead of updating it — try `previousName` first, since that's
 * what the sibling's row is still called.
 */
export async function propagateProductUpsert(
  supabase: SupabaseClient,
  sourceAccountId: string,
  product: SyncableProduct,
  previousName?: string | null
): Promise<void> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return

  const lookupNames = previousName && previousName !== product.name ? [previousName, product.name] : [product.name]

  await Promise.all(
    targets.map(async (channel_account_id) => {
      let existingId: string | null = null
      for (const lookupName of lookupNames) {
        const { data: existing, error } = await supabase
          .from('products')
          .select('id')
          .eq('channel_account_id', channel_account_id)
          .eq('name', lookupName)
          .maybeSingle()
        if (error) {
          console.error(`[boutique-sync] Failed to look up product "${lookupName}" on account ${channel_account_id}:`, error)
          continue
        }
        if (existing) {
          existingId = existing.id
          break
        }
      }

      const { error: writeError } = existingId
        ? await supabase.from('products').update(product).eq('id', existingId)
        : await supabase.from('products').insert({ ...product, channel_account_id })

      if (writeError) {
        console.error(`[boutique-sync] Failed to sync product "${product.name}" to account ${channel_account_id}:`, writeError)
      }
    })
  )
}

export async function propagateProductDelete(supabase: SupabaseClient, sourceAccountId: string, productName: string): Promise<void> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return

  const results = await Promise.all(
    targets.map((channel_account_id) => supabase.from('products').delete().eq('channel_account_id', channel_account_id).eq('name', productName))
  )
  for (const { error } of results) {
    if (error) console.error('[boutique-sync] Failed to propagate product deletion to a sibling account:', error)
  }
}

export type SyncNowResult =
  | { status: 'synced'; targets: number; products: number }
  | { status: 'no_op'; reason: 'sync_disabled_or_no_workspace' | 'no_siblings' }

/**
 * One-shot "Synchroniser maintenant" — pushes the source account's FULL
 * current state (agent_settings + every active product + its variants) to
 * every sibling in the workspace, for catching up after sync was off while
 * things diverged. Ongoing changes after this are handled turn-by-turn by
 * propagateAgentSettings/propagateProductUpsert from the settings/products
 * routes — this is only the one-time backfill.
 */
export async function syncNow(supabase: SupabaseClient, sourceAccountId: string): Promise<SyncNowResult> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) {
    // Distinguishing these two matters: the toggle component used to show a
    // "success" toast for a 0/0 result regardless of why, which looked
    // exactly like a real sync from the user's side.
    const { data: account } = await supabase.from('channel_accounts').select('workspace_id').eq('id', sourceAccountId).maybeSingle()
    const { data: workspace } = account?.workspace_id
      ? await supabase.from('workspaces').select('boutique_sync_enabled').eq('id', account.workspace_id).maybeSingle()
      : { data: null }
    return { status: 'no_op', reason: workspace?.boutique_sync_enabled ? 'no_siblings' : 'sync_disabled_or_no_workspace' }
  }

  const [{ data: settings, error: settingsError }, { data: products, error: productsError }] = await Promise.all([
    supabase.from('agent_settings').select('*').eq('channel_account_id', sourceAccountId).maybeSingle(),
    supabase.from('products').select('*').eq('channel_account_id', sourceAccountId).eq('is_active', true),
  ])
  if (settingsError) console.error('[boutique-sync] sync-now: failed to load source agent_settings:', settingsError)
  if (productsError) console.error('[boutique-sync] sync-now: failed to load source products:', productsError)

  if (settings) await propagateAgentSettings(supabase, sourceAccountId, settings)

  for (const product of products ?? []) {
    await propagateProductUpsert(supabase, sourceAccountId, {
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      kind: product.kind,
      sizes: product.sizes,
      colors: product.colors,
      image_url: product.image_url,
      images: product.images,
      category: product.category,
      metadata: product.metadata,
      track_stock: product.track_stock,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
    })

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('size, color, price_override, stock_quantity')
      .eq('product_id', product.id)
    if (variantsError) {
      console.error(`[boutique-sync] sync-now: failed to load variants for "${product.name}":`, variantsError)
      continue
    }
    if (!variants?.length) continue

    for (const targetAccountId of targets) {
      const { data: targetProduct, error: targetError } = await supabase
        .from('products')
        .select('id')
        .eq('channel_account_id', targetAccountId)
        .eq('name', product.name)
        .maybeSingle()
      if (targetError) {
        console.error(`[boutique-sync] sync-now: failed to find "${product.name}" on account ${targetAccountId}:`, targetError)
        continue
      }
      if (!targetProduct) continue

      for (const variant of variants) {
        const { error: variantWriteError } = await supabase.from('product_variants').upsert(
          { product_id: targetProduct.id, size: variant.size, color: variant.color, price_override: variant.price_override, stock_quantity: variant.stock_quantity },
          { onConflict: 'product_id,size,color' }
        )
        if (variantWriteError) console.error(`[boutique-sync] sync-now: failed to sync a variant of "${product.name}":`, variantWriteError)
      }
    }
  }

  return { status: 'synced', targets: targets.length, products: (products ?? []).length }
}
