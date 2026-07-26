import { describe, it, expect } from 'vitest'
import { assertSafeOutboundUrl, quickUrlShapeCheck, UnsafeUrlError } from '@/lib/security/url-guard'

describe('assertSafeOutboundUrl', () => {
  it('blocks literal loopback addresses', async () => {
    await expect(assertSafeOutboundUrl('http://127.0.0.1/secret')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks the cloud metadata endpoint', async () => {
    await expect(assertSafeOutboundUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks private 10.x addresses', async () => {
    await expect(assertSafeOutboundUrl('http://10.0.0.5/internal')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks private 192.168.x addresses', async () => {
    await expect(assertSafeOutboundUrl('http://192.168.1.1/')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks IPv6 loopback', async () => {
    await expect(assertSafeOutboundUrl('http://[::1]/')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks IPv6 unique-local (fc00::/7)', async () => {
    await expect(assertSafeOutboundUrl('http://[fd00::1]/')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks IPv4-mapped IPv6 pointing at a private address', async () => {
    await expect(assertSafeOutboundUrl('http://[::ffff:127.0.0.1]/')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks non-http(s) schemes', async () => {
    await expect(assertSafeOutboundUrl('file:///etc/passwd')).rejects.toThrow(UnsafeUrlError)
  })

  it('blocks URLs with embedded credentials', async () => {
    await expect(assertSafeOutboundUrl('http://user:pass@example.com/')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects invalid URLs', async () => {
    await expect(assertSafeOutboundUrl('not a url')).rejects.toThrow(UnsafeUrlError)
  })

  it('allows an ordinary public https URL', async () => {
    const url = await assertSafeOutboundUrl('https://example.com/webhook')
    expect(url.hostname).toBe('example.com')
  })
})

describe('quickUrlShapeCheck', () => {
  it('returns an error for a literal private IP without a DNS lookup', () => {
    expect(quickUrlShapeCheck('http://127.0.0.1/')).toMatch(/Blocked target address/)
  })

  it('returns an error for a bad scheme', () => {
    expect(quickUrlShapeCheck('javascript:alert(1)')).toMatch(/Unsupported URL scheme/)
  })

  it('returns null for an ordinary https URL', () => {
    expect(quickUrlShapeCheck('https://example.com/webhook')).toBeNull()
  })

  it('does not attempt DNS resolution (a bad-but-plausible hostname passes the shape check)', () => {
    expect(quickUrlShapeCheck('https://internal-service.local/')).toBeNull()
  })
})
