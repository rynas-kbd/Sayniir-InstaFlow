import { describe, test, expect } from 'vitest'
import { buildMediaRequestUrl, parseMediaPage } from '../../../lib/instagram/media'

describe('buildMediaRequestUrl', () => {
  test('includes the limit and access token, and omits `after` on the first page', () => {
    const url = buildMediaRequestUrl({ accessToken: 'tok-123', limit: 24 })
    const parsed = new URL(url)

    expect(parsed.hostname).toBe('graph.instagram.com')
    expect(parsed.searchParams.get('limit')).toBe('24')
    expect(parsed.searchParams.get('access_token')).toBe('tok-123')
    expect(parsed.searchParams.has('after')).toBe(false)
  })

  test('includes `after` when paginating', () => {
    const url = buildMediaRequestUrl({ accessToken: 'tok-123', limit: 24, after: 'cursor-abc' })
    const parsed = new URL(url)

    expect(parsed.searchParams.get('after')).toBe('cursor-abc')
  })

  test('omits `after` when explicitly null', () => {
    const url = buildMediaRequestUrl({ accessToken: 'tok-123', limit: 24, after: null })
    expect(new URL(url).searchParams.has('after')).toBe(false)
  })
})

describe('parseMediaPage', () => {
  test('returns items and the next cursor when a next page exists', () => {
    const page = parseMediaPage({
      data: [{ id: 'm1', media_url: 'https://example.com/1.jpg' }],
      paging: { next: 'https://graph.instagram.com/...', cursors: { after: 'cursor-next' } },
    })

    expect(page.items).toHaveLength(1)
    expect(page.nextCursor).toBe('cursor-next')
  })

  test('reports no next cursor on the last page, even if a cursor value is present', () => {
    const page = parseMediaPage({
      data: [{ id: 'm1', media_url: 'https://example.com/1.jpg' }],
      paging: { cursors: { after: 'cursor-stale' } },
    })

    expect(page.nextCursor).toBeNull()
  })

  test('handles an empty response', () => {
    const page = parseMediaPage({})
    expect(page.items).toEqual([])
    expect(page.nextCursor).toBeNull()
  })
})
