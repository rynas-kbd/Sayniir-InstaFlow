import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { Product } from '@/lib/agent/ecommerce/state'
import { makeFakeSupabase, type FakeSupabase } from '../../../helpers/fake-supabase'

/**
 * Covers every AvailabilityResolution kind (requirement §9's error/fallback
 * matrix) without ever hitting a real network or LLM call — resolveAvailability
 * is pure DB + deterministic matching, see lib/agent/ecommerce/availability.ts.
 */

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeSupabase,
}))

const resolvePostToProduct = vi.fn()
vi.mock('@/lib/agent/ecommerce/post-resolver', () => ({
  resolvePostToProduct: (...args: unknown[]) => resolvePostToProduct(...args),
}))

const { resolveAvailability } = await import('@/lib/agent/ecommerce/availability')

const shirt: Product = { id: 'p1', name: 'T-shirt Sasuke', price: 2500, currency: 'DZD', track_stock: true, stock_quantity: 3 }
const outOfStockShirt: Product = { id: 'p2', name: 'Hoodie Naruto', price: 4500, currency: 'DZD', track_stock: true, stock_quantity: 0 }
const decorativeStock: Product = { id: 'p3', name: 'Mug One Piece', price: 1200, currency: 'DZD', track_stock: false, stock_quantity: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  fakeSupabase = makeFakeSupabase()
  fakeSupabase._bareOverrides.product_variants = [{ data: [], error: null }]
})

describe('resolveAvailability — direct product match in the message text', () => {
  test('a product with stock resolves to available', async () => {
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 't-shirt sasuke dispo ?', products: [shirt] })
    expect(result).toMatchObject({ kind: 'available', product: { id: 'p1' } })
  })

  test('a product with zero stock (track_stock=true) resolves to out_of_stock', async () => {
    const result = await resolveAvailability({
      supabase: fakeSupabase,
      accountId: 'acct-1',
      messageText: 'hoodie naruto dispo ?',
      products: [outOfStockShirt],
    })
    expect(result).toMatchObject({ kind: 'out_of_stock', product: { id: 'p2' } })
  })

  test('track_stock=false is always available regardless of stock_quantity', async () => {
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'mug one piece dispo ?', products: [decorativeStock] })
    expect(result).toMatchObject({ kind: 'available', product: { id: 'p3' } })
  })

  test('stock summed across variants — any variant with stock means available', async () => {
    fakeSupabase._bareOverrides.product_variants = [{ data: [{ stock_quantity: 0 }, { stock_quantity: 2 }], error: null }]
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 't-shirt sasuke dispo ?', products: [shirt] })
    expect(result.kind).toBe('available')
  })

  test('all variants at zero stock means out_of_stock even if the base product row says otherwise', async () => {
    fakeSupabase._bareOverrides.product_variants = [{ data: [{ stock_quantity: 0 }, { stock_quantity: 0 }], error: null }]
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 't-shirt sasuke dispo ?', products: [shirt] })
    expect(result.kind).toBe('out_of_stock')
  })
})

describe('resolveAvailability — ambiguous product', () => {
  test('two equally-plausible candidates return ambiguous, never an arbitrary pick', async () => {
    const twins: Product[] = [
      { id: 'a', name: 'Robe Noire', price: 3000 },
      { id: 'b', name: 'Robe Noire XL', price: 3200 },
    ]
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'la robe noire dispo ?', products: twins })
    expect(result.kind).toBe('ambiguous')
  })
})

describe('resolveAvailability — no product reference, no shared post', () => {
  test('returns no_product_reference so the caller can ask for clarification', async () => {
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'dispo ?', products: [shirt] })
    expect(result.kind).toBe('no_product_reference')
    expect(resolvePostToProduct).not.toHaveBeenCalled()
  })
})

describe('resolveAvailability — shared post fallback', () => {
  const sharedPost = { kind: 'share' as const, url: 'https://instagram.com/p/ABC123/' }

  test('resolved via post → stock-checked like a direct match', async () => {
    resolvePostToProduct.mockResolvedValue({ status: 'resolved', product: shirt })
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'dispo ?', sharedPost, products: [shirt] })
    expect(result).toMatchObject({ kind: 'available', product: { id: 'p1' } })
  })

  test('ambiguous post resolution is forwarded as-is', async () => {
    resolvePostToProduct.mockResolvedValue({ status: 'ambiguous', candidates: [shirt, outOfStockShirt] })
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'dispo ?', sharedPost, products: [shirt, outOfStockShirt] })
    expect(result.kind).toBe('ambiguous')
  })

  test('post not found in the catalog → not_found', async () => {
    resolvePostToProduct.mockResolvedValue({ status: 'not_found' })
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'dispo ?', sharedPost, products: [shirt] })
    expect(result.kind).toBe('not_found')
  })

  test('RapidAPI unavailable → lookup_failed, never a guessed product', async () => {
    resolvePostToProduct.mockResolvedValue({ status: 'lookup_failed', reason: 'timeout' })
    const result = await resolveAvailability({ supabase: fakeSupabase, accountId: 'acct-1', messageText: 'dispo ?', sharedPost, products: [shirt] })
    expect(result).toEqual({ kind: 'lookup_failed', reason: 'timeout' })
  })
})
