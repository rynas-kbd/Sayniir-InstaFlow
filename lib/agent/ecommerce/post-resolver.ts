import type { SharedPostRef } from '../../channels/types.ts'
import type { Product } from './state.ts'
import { matchProducts } from './product-match.ts'
import { lookupInstagramMedia, extractShortcodeFromUrl } from '../../integrations/rapidapi/instagram.ts'

/**
 * Minimal Supabase surface this module needs — deliberately narrower than
 * `ReturnType<typeof createAdminClient>` (the real SupabaseClient type) so
 * tests can pass the lightweight fake in __tests__/helpers/fake-supabase.ts
 * instead of a fully-shaped client. createAdminClient() itself is created
 * with no Database generic, so its own `.from()` chain is already
 * effectively untyped in production — this loses nothing real.
 */
export interface SupabaseQueryClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
}

/**
 * Resolves a customer-shared Instagram post to one of the shop's products,
 * cheapest path first — see requirement §2:
 *   1. Detect a product is probably referenced (sharedPost is present).
 *   2. Cache lookup (product_posts) — zero network calls on a hit.
 *   3. RapidAPI lookup for the caption, on a cache miss.
 *   4. Match that caption against the catalog (product-match.ts).
 *   5. Cache a successful, unambiguous resolution for next time.
 * Every failure mode from requirement §9 gets its own status — this module
 * never guesses a product, only ever returns one it's actually confident in.
 */

export type PostResolution =
  | { status: 'resolved'; product: Product; source: 'cache' | 'rapidapi' }
  | { status: 'ambiguous'; candidates: Product[] }
  | { status: 'not_found' }
  | { status: 'lookup_failed'; reason: string }
  | { status: 'no_post' }

interface ProductPostCacheRow {
  product_id: string
  caption: string | null
}

async function findCachedProduct(
  supabase: SupabaseQueryClient,
  channelAccountId: string,
  identifiers: { mediaId?: string; shortcode?: string }
): Promise<ProductPostCacheRow | null> {
  if (identifiers.mediaId) {
    const { data } = await supabase
      .from('product_posts')
      .select('product_id, caption')
      .eq('channel_account_id', channelAccountId)
      .eq('media_id', identifiers.mediaId)
      .maybeSingle()
    if (data) return data
  }
  if (identifiers.shortcode) {
    const { data } = await supabase
      .from('product_posts')
      .select('product_id, caption')
      .eq('channel_account_id', channelAccountId)
      .eq('shortcode', identifiers.shortcode)
      .maybeSingle()
    if (data) return data
  }
  return null
}

/**
 * Best-effort — a failed cache write must never turn a resolved product into
 * an error for the customer. A plain insert rather than an upsert: the
 * unique constraints in the migration are PARTIAL indexes (one per
 * identifier, since either can be null), and Postgres can't infer a partial
 * index as an ON CONFLICT arbiter from a bare column list the way
 * product_variants' full UNIQUE constraint allows. A concurrent duplicate
 * insert just hits 23505 — same race pattern already used for order_sessions
 * creation in handler.ts.
 */
async function cacheResolution(
  supabase: SupabaseQueryClient,
  channelAccountId: string,
  productId: string,
  identifiers: { mediaId?: string; shortcode?: string; permalink?: string; caption?: string }
): Promise<void> {
  const { error } = await supabase.from('product_posts').insert({
    channel_account_id: channelAccountId,
    product_id: productId,
    media_id: identifiers.mediaId ?? null,
    shortcode: identifiers.shortcode ?? null,
    permalink: identifiers.permalink ?? null,
    caption: identifiers.caption ?? null,
    source: 'rapidapi_cache',
  })
  if (error && error.code !== '23505') {
    console.error('[PostResolver] Failed to cache post→product resolution (non-fatal):', error)
  }
}

export async function resolvePostToProduct(args: {
  supabase: SupabaseQueryClient
  channelAccountId: string
  sharedPost: SharedPostRef | undefined
  products: Product[]
}): Promise<PostResolution> {
  const { supabase, channelAccountId, sharedPost, products } = args
  if (!sharedPost) return { status: 'no_post' }

  const shortcode = sharedPost.url ? extractShortcodeFromUrl(sharedPost.url) ?? undefined : undefined
  const mediaId = sharedPost.mediaId
  const identifiers = { mediaId, shortcode }

  if (mediaId || shortcode) {
    const cached = await findCachedProduct(supabase, channelAccountId, identifiers)
    if (cached) {
      const product = products.find((p) => p.id === cached.product_id)
      // The link exists but the product it points to is gone/deactivated —
      // surface as not_found rather than silently falling through to
      // RapidAPI, which would likely just re-derive the same stale answer.
      return product ? { status: 'resolved', product, source: 'cache' } : { status: 'not_found' }
    }
  }

  const lookup = await lookupInstagramMedia({ shortcode, mediaId, url: sharedPost.url })
  if (!lookup.ok) {
    if (lookup.reason === 'not_configured' || lookup.reason === 'no_identifier') {
      // Nothing more this module can try — the customer's post genuinely
      // can't be identified yet (no RapidAPI key, or Meta gave us only an
      // opaque CDN url with no shortcode). Not a system failure: report as
      // "couldn't find a product", the caller asks the customer to name it.
      return { status: 'not_found' }
    }
    return { status: 'lookup_failed', reason: lookup.reason }
  }

  const caption = lookup.media.caption
  if (!caption) return { status: 'not_found' }

  const match = matchProducts(caption, products)
  if (match.ambiguous) return { status: 'ambiguous', candidates: match.candidates.slice(0, 3).map((c) => c.product) }
  if (!match.best) return { status: 'not_found' }

  await cacheResolution(supabase, channelAccountId, match.best.product.id, {
    mediaId: lookup.media.mediaId ?? mediaId,
    shortcode: lookup.media.shortcode ?? shortcode,
    permalink: lookup.media.permalink,
    caption,
  })

  return { status: 'resolved', product: match.best.product, source: 'rapidapi' }
}
