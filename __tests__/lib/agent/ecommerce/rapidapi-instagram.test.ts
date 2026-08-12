import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { lookupInstagramMedia, extractShortcodeFromUrl } from '@/lib/integrations/rapidapi/instagram'

/** Every failure mode must be a typed result, never a thrown error — see requirement §9 / §2. */

const originalKey = process.env.RAPIDAPI_KEY

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.RAPIDAPI_KEY = originalKey
})

describe('extractShortcodeFromUrl', () => {
  test('extracts the shortcode from a /p/ permalink', () => {
    expect(extractShortcodeFromUrl('https://www.instagram.com/p/ABC123xyz/')).toBe('ABC123xyz')
  })

  test('extracts the shortcode from a /reel/ permalink', () => {
    expect(extractShortcodeFromUrl('https://www.instagram.com/reel/XYZ987/?utm_source=ig')).toBe('XYZ987')
  })

  test('returns null for a URL with no shortcode', () => {
    expect(extractShortcodeFromUrl('https://cdn.instagram.com/some/opaque/media.jpg')).toBeNull()
  })
})

describe('lookupInstagramMedia — never throws', () => {
  test('missing RAPIDAPI_KEY → not_configured, no network call', async () => {
    delete process.env.RAPIDAPI_KEY
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await lookupInstagramMedia({ shortcode: 'ABC123' })
    expect(result).toEqual({ ok: false, reason: 'not_configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('no shortcode/mediaId/resolvable url → no_identifier, no network call', async () => {
    process.env.RAPIDAPI_KEY = 'test-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await lookupInstagramMedia({ url: 'https://cdn.instagram.com/opaque.jpg' })
    expect(result).toEqual({ ok: false, reason: 'no_identifier' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('a timeout is reported as reason "timeout", not thrown', async () => {
    process.env.RAPIDAPI_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      const err = new DOMException('aborted', 'TimeoutError')
      return Promise.reject(err)
    })
    const result = await lookupInstagramMedia({ shortcode: 'ABC123' })
    expect(result).toEqual({ ok: false, reason: 'timeout' })
  })

  test('an HTTP error status is reported as reason "http_error"', async () => {
    process.env.RAPIDAPI_KEY = 'test-key'
    // A fresh Response per call — 429 is retried once (see withRetry), and a
    // Response body stream can only be read once; reusing one instance via
    // mockResolvedValue would make the retry's read throw a stream-locked
    // error instead of exercising the retry path this test is actually for.
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('rate limited', { status: 429 }))
    const result = await lookupInstagramMedia({ shortcode: 'ABC123' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('http_error')
  })

  test('an unparseable JSON body is reported as reason "unparseable"', async () => {
    process.env.RAPIDAPI_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not json', { status: 200 }))
    const result = await lookupInstagramMedia({ shortcode: 'ABC123' })
    expect(result).toEqual({ ok: false, reason: 'unparseable' })
  })

  test('a well-formed response resolves the caption', async () => {
    process.env.RAPIDAPI_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'media-1', shortcode: 'ABC123', caption: 'T-shirt Sasuke disponible !' } }), { status: 200 })
    )
    const result = await lookupInstagramMedia({ shortcode: 'ABC123' })
    expect(result).toEqual({ ok: true, media: { mediaId: 'media-1', shortcode: 'ABC123', caption: 'T-shirt Sasuke disponible !', permalink: undefined } })
  })
})
