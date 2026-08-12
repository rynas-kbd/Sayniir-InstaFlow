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
 */

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Sibling account ids to propagate to, or [] if this account's workspace has sync off (or no workspace/siblings). */
export async function resolveSyncTargets(supabase: SupabaseClient, sourceAccountId: string): Promise<string[]> {
  const { data: account } = await supabase.from('channel_accounts').select('workspace_id').eq('id', sourceAccountId).maybeSingle()
  if (!account?.workspace_id) return []

  const { data: workspace } = await supabase.from('workspaces').select('boutique_sync_enabled').eq('id', account.workspace_id).maybeSingle()
  if (!workspace?.boutique_sync_enabled) return []

  const { data: siblings } = await supabase.from('channel_accounts').select('id').eq('workspace_id', account.workspace_id).neq('id', sourceAccountId)
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

  await Promise.all(
    targets.map((channel_account_id) =>
      supabase.from('agent_settings').upsert({ channel_account_id, ...patch, updated_at: new Date().toISOString() })
    )
  )
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

/** Create-or-update by name on every sibling — mirrors app/api/products/sync-sheet/route.ts's existing match-by-name convention, since products have no cross-account id relationship. */
export async function propagateProductUpsert(supabase: SupabaseClient, sourceAccountId: string, product: SyncableProduct): Promise<void> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return

  await Promise.all(
    targets.map(async (channel_account_id) => {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('channel_account_id', channel_account_id)
        .eq('name', product.name)
        .maybeSingle()

      if (existing) {
        await supabase.from('products').update(product).eq('id', existing.id)
      } else {
        await supabase.from('products').insert({ ...product, channel_account_id })
      }
    })
  )
}

export async function propagateProductDelete(supabase: SupabaseClient, sourceAccountId: string, productName: string): Promise<void> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return

  await Promise.all(targets.map((channel_account_id) => supabase.from('products').delete().eq('channel_account_id', channel_account_id).eq('name', productName)))
}

/**
 * One-shot "Synchroniser maintenant" — pushes the source account's FULL
 * current state (agent_settings + every active product + its variants) to
 * every sibling in the workspace, for catching up after sync was off while
 * things diverged. Ongoing changes after this are handled turn-by-turn by
 * propagateAgentSettings/propagateProductUpsert from the settings/products
 * routes — this is only the one-time backfill.
 */
export async function syncNow(supabase: SupabaseClient, sourceAccountId: string): Promise<{ targets: number; products: number }> {
  const targets = await resolveSyncTargets(supabase, sourceAccountId)
  if (targets.length === 0) return { targets: 0, products: 0 }

  const [{ data: settings }, { data: products }] = await Promise.all([
    supabase.from('agent_settings').select('*').eq('channel_account_id', sourceAccountId).maybeSingle(),
    supabase.from('products').select('*').eq('channel_account_id', sourceAccountId).eq('is_active', true),
  ])

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

    const { data: variants } = await supabase.from('product_variants').select('size, color, price_override, stock_quantity').eq('product_id', product.id)
    if (!variants?.length) continue

    for (const targetAccountId of targets) {
      const { data: targetProduct } = await supabase
        .from('products')
        .select('id')
        .eq('channel_account_id', targetAccountId)
        .eq('name', product.name)
        .maybeSingle()
      if (!targetProduct) continue

      for (const variant of variants) {
        await supabase.from('product_variants').upsert(
          { product_id: targetProduct.id, size: variant.size, color: variant.color, price_override: variant.price_override, stock_quantity: variant.stock_quantity },
          { onConflict: 'product_id,size,color' }
        )
      }
    }
  }

  return { targets: targets.length, products: (products ?? []).length }
}
