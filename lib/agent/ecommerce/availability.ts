import { createAdminClient } from '../../supabase/admin.ts'
import { sendAndReport, type AgentChannel } from '../messaging.ts'
import type { AgentOutcome } from '../types.ts'
import type { SharedPostRef } from '../../channels/types.ts'
import { getTemplate } from './templates.ts'
import { detectLanguage } from './lang.ts'
import { matchProducts } from './product-match.ts'
import { resolvePostToProduct, type SupabaseQueryClient } from './post-resolver.ts'
import type { Product } from './state.ts'

/**
 * Vérification de disponibilité — deterministic, no LLM call anywhere in
 * this module. The whole point of this feature (requirement: "ne jamais
 * inventer la disponibilité ou les informations d'un produit") is that an
 * availability answer is a hard stock check, never a model's best guess —
 * see lib/agent/ecommerce/handler.ts's Q&A path for the thing this is NOT:
 * there, the catalog is pre-filtered by stock and the LLM just never sees
 * (and can't mention) an out-of-stock item, which is silence, not a
 * verified "no".
 */

export type AvailabilityResolution =
  | { kind: 'available'; product: Product }
  | { kind: 'out_of_stock'; product: Product }
  | { kind: 'ambiguous'; candidates: Product[] }
  | { kind: 'not_found' }
  | { kind: 'no_product_reference' }
  | { kind: 'lookup_failed'; reason: string }

async function isProductAvailable(supabase: SupabaseQueryClient, product: Product): Promise<boolean> {
  // track_stock=false is a deliberate merchant opt-out (20260826_conversation_quality.sql)
  // — stock is decorative for that product, treat it as always available.
  if (product.track_stock === false) return true

  const { data: variants } = await supabase.from('product_variants').select('stock_quantity').eq('product_id', product.id)
  if (variants && variants.length > 0) {
    return variants.reduce((sum: number, v: { stock_quantity: number | null }) => sum + (v.stock_quantity ?? 0), 0) > 0
  }

  return (product.stock_quantity ?? 0) > 0
}

async function withStockCheck(supabase: SupabaseQueryClient, product: Product): Promise<AvailabilityResolution> {
  const available = await isProductAvailable(supabase, product)
  return available ? { kind: 'available', product } : { kind: 'out_of_stock', product }
}

/**
 * Identification order (requirement §2/§4): try to read a product straight
 * out of the message text first (handles "dispo le t-shirt sasuke ?" without
 * needing a shared post at all); only fall back to post resolution when the
 * text alone names nothing and a post was actually shared.
 */
export async function resolveAvailability(args: {
  supabase: SupabaseQueryClient
  accountId: string
  messageText: string
  sharedPost?: SharedPostRef
  products: Product[]
}): Promise<AvailabilityResolution> {
  const direct = matchProducts(args.messageText, args.products)
  if (direct.ambiguous) return { kind: 'ambiguous', candidates: direct.candidates.slice(0, 3).map((c) => c.product) }
  if (direct.best) return withStockCheck(args.supabase, direct.best.product)

  if (!args.sharedPost) return { kind: 'no_product_reference' }

  const postResolution = await resolvePostToProduct({
    supabase: args.supabase,
    channelAccountId: args.accountId,
    sharedPost: args.sharedPost,
    products: args.products,
  })

  switch (postResolution.status) {
    case 'resolved':
      return withStockCheck(args.supabase, postResolution.product)
    case 'ambiguous':
      return { kind: 'ambiguous', candidates: postResolution.candidates }
    case 'lookup_failed':
      return { kind: 'lookup_failed', reason: postResolution.reason }
    case 'not_found':
    case 'no_post':
      return { kind: 'not_found' }
  }
}

export async function handleAvailabilityMessage(args: {
  accountId: string
  senderId: string
  channel: AgentChannel
  messageText: string
  sharedPost?: SharedPostRef
}): Promise<{ outcome: AgentOutcome; availableProductId: string | null }> {
  const route = 'ecommerce.availability'
  const lang = detectLanguage(args.messageText, 'fr')
  const t = getTemplate(lang)
  const supabase = createAdminClient()

  // Deliberately NOT stock-filtered (unlike the Q&A catalog in
  // inbound.ts) — this handler's whole job is to distinguish "out of
  // stock" from "doesn't exist", which requires seeing everything active.
  const { data: products, error } = await supabase.from('products').select('*').eq('channel_account_id', args.accountId).eq('is_active', true)

  if (error) {
    console.error('[Availability] Failed to load catalog:', error)
    return { outcome: { status: 'error', error, route }, availableProductId: null }
  }

  const resolution = await resolveAvailability({
    supabase,
    accountId: args.accountId,
    messageText: args.messageText,
    sharedPost: args.sharedPost,
    products: products ?? [],
  })

  console.log(
    `[Availability] account=${args.accountId} sender=${args.senderId} kind=${resolution.kind}` +
      (resolution.kind === 'available' || resolution.kind === 'out_of_stock' ? ` product=${resolution.product.id}` : '') +
      (resolution.kind === 'ambiguous' ? ` candidates=${resolution.candidates.length}` : '') +
      (resolution.kind === 'lookup_failed' ? ` reason=${resolution.reason}` : '')
  )

  switch (resolution.kind) {
    case 'available': {
      const outcome = await sendAndReport(
        args.channel,
        t.availableYes(resolution.product.name, resolution.product.price, resolution.product.currency ?? 'DZD'),
        route
      )
      return { outcome, availableProductId: resolution.product.id }
    }
    case 'out_of_stock': {
      const outcome = await sendAndReport(args.channel, t.availableNo(resolution.product.name), route)
      return { outcome, availableProductId: null }
    }
    case 'ambiguous': {
      const quickReplies = resolution.candidates.map((p) => ({ title: p.name, payload: p.name }))
      const outcome = await sendAndReport(args.channel, t.availabilityAmbiguous(resolution.candidates.map((p) => p.name)), route, quickReplies)
      return { outcome, availableProductId: null }
    }
    case 'not_found': {
      const outcome = await sendAndReport(args.channel, t.availabilityNotFound, route)
      return { outcome, availableProductId: null }
    }
    case 'lookup_failed': {
      console.error(`[Availability] Post resolution failed: ${resolution.reason}`)
      const outcome = await sendAndReport(args.channel, t.availabilityLookupFailed, route)
      return { outcome, availableProductId: null }
    }
    case 'no_product_reference': {
      // By the time this handler runs, the intent router already decided
      // this message IS an availability question (see inbound.ts) — so
      // "no product identified" is exactly the ambiguous-intent case
      // requirement §9 calls out: ask for clarification rather than
      // silently handing an availability question to the Q&A agent, which
      // has no idea it was ever asked and could answer something
      // unrelated.
      const outcome = await sendAndReport(args.channel, t.availabilityNeedsProduct, route)
      return { outcome, availableProductId: null }
    }
  }
}
