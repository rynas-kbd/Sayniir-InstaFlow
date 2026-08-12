import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { Product } from '@/lib/agent/ecommerce/state'
import { makeFakeSupabase, type FakeSupabase } from '../../../helpers/fake-supabase'

const lookupInstagramMedia = vi.fn()
vi.mock('@/lib/integrations/rapidapi/instagram', () => ({
  lookupInstagramMedia: (...args: unknown[]) => lookupInstagramMedia(...args),
  extractShortcodeFromUrl: (url: string) => {
    const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i)
    return match ? match[1] : null
  },
}))

const { resolvePostToProduct } = await import('@/lib/agent/ecommerce/post-resolver')

const shirt: Product = { id: 'p1', name: 'T-shirt Sasuke', price: 2500 }
const hoodie: Product = { id: 'p2', name: 'Hoodie Naruto', price: 4500 }

let fakeSupabase: FakeSupabase

beforeEach(() => {
  vi.clearAllMocks()
  fakeSupabase = makeFakeSupabase()
})

describe('resolvePostToProduct — cache hit', () => {
  test('a media_id already cached resolves with zero network calls', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: { product_id: 'p1', caption: null }, error: null }]
    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt, hoodie],
    })
    expect(result).toEqual({ status: 'resolved', product: shirt, source: 'cache' })
    expect(lookupInstagramMedia).not.toHaveBeenCalled()
  })

  test('a cached link whose product no longer exists in the active catalog is not_found', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: { product_id: 'deleted-product', caption: null }, error: null }]
    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt, hoodie],
    })
    expect(result).toEqual({ status: 'not_found' })
  })
})

describe('resolvePostToProduct — cache miss → RapidAPI', () => {
  test('resolves via caption match and caches the result', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: null, error: null }]
    lookupInstagramMedia.mockResolvedValue({ ok: true, media: { mediaId: 'media-1', caption: 'Notre T-shirt Sasuke est de retour !' } })

    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt, hoodie],
    })

    expect(result).toMatchObject({ status: 'resolved', product: { id: 'p1' }, source: 'rapidapi' })
    expect(fakeSupabase._inserted.product_posts).toHaveLength(1)
    expect(fakeSupabase._inserted.product_posts[0]).toMatchObject({ product_id: 'p1', source: 'rapidapi_cache' })
  })

  test('an ambiguous caption match is reported, not guessed', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: null, error: null }]
    // Not an exact name match on purpose (extra words) — matchProducts' exact-match
    // short-circuit only fires on a caption that IS the product name verbatim,
    // which would trivially resolve either twin and never exercise ambiguity.
    lookupInstagramMedia.mockResolvedValue({ ok: true, media: { mediaId: 'media-1', caption: 'Notre nouvelle Robe Noire est arrivée' } })
    const twins: Product[] = [
      { id: 'a', name: 'Robe Noire', price: 3000 },
      { id: 'b', name: 'Robe Noire XL', price: 3200 },
    ]
    const result = await resolvePostToProduct({ supabase: fakeSupabase, channelAccountId: 'acct-1', sharedPost: { kind: 'share', mediaId: 'media-1' }, products: twins })
    expect(result.status).toBe('ambiguous')
  })

  test('RapidAPI unavailable degrades to not_found without throwing', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: null, error: null }]
    lookupInstagramMedia.mockResolvedValue({ ok: false, reason: 'not_configured' })
    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt],
    })
    expect(result).toEqual({ status: 'not_found' })
  })

  test('a genuine RapidAPI failure (timeout/http_error) surfaces as lookup_failed', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: null, error: null }]
    lookupInstagramMedia.mockResolvedValue({ ok: false, reason: 'timeout' })
    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt],
    })
    expect(result).toEqual({ status: 'lookup_failed', reason: 'timeout' })
  })

  test('no caption in the resolved media → not_found', async () => {
    fakeSupabase._singleQueues.product_posts = [{ data: null, error: null }]
    lookupInstagramMedia.mockResolvedValue({ ok: true, media: { mediaId: 'media-1' } })
    const result = await resolvePostToProduct({
      supabase: fakeSupabase,
      channelAccountId: 'acct-1',
      sharedPost: { kind: 'share', mediaId: 'media-1' },
      products: [shirt],
    })
    expect(result).toEqual({ status: 'not_found' })
  })
})

describe('resolvePostToProduct — no post shared', () => {
  test('returns no_post when there is nothing to resolve', async () => {
    const result = await resolvePostToProduct({ supabase: fakeSupabase, channelAccountId: 'acct-1', sharedPost: undefined, products: [shirt] })
    expect(result).toEqual({ status: 'no_post' })
    expect(lookupInstagramMedia).not.toHaveBeenCalled()
  })
})
