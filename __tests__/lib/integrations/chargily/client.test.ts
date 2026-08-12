import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { createChargilyCheckout, verifyChargilySignature } from '@/lib/integrations/chargily/client'

const originalKey = process.env.CHARGILY_SECRET_KEY
const originalMode = process.env.CHARGILY_MODE

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.CHARGILY_SECRET_KEY = originalKey
  process.env.CHARGILY_MODE = originalMode
})

describe('createChargilyCheckout — never throws', () => {
  test('missing CHARGILY_SECRET_KEY → not_configured, no network call', async () => {
    delete process.env.CHARGILY_SECRET_KEY
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await createChargilyCheckout({ amountDzd: 4900, successUrl: 'https://x.test/success' })
    expect(result).toEqual({ ok: false, reason: 'not_configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('a timeout is reported as reason "timeout", not thrown', async () => {
    process.env.CHARGILY_SECRET_KEY = 'test_sk_fake'
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new DOMException('aborted', 'TimeoutError')))
    const result = await createChargilyCheckout({ amountDzd: 4900, successUrl: 'https://x.test/success' })
    expect(result).toEqual({ ok: false, reason: 'timeout' })
  })

  test('an HTTP error status is reported as reason "http_error" after one retry on 429', async () => {
    process.env.CHARGILY_SECRET_KEY = 'test_sk_fake'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('rate limited', { status: 429 }))
    const result = await createChargilyCheckout({ amountDzd: 4900, successUrl: 'https://x.test/success' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('http_error')
  })

  test('sends the amount as a raw integer, no ×100 multiplier', async () => {
    process.env.CHARGILY_SECRET_KEY = 'test_sk_fake'
    let sentBody: Record<string, unknown> | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      sentBody = JSON.parse((init as RequestInit).body as string)
      return new Response(JSON.stringify({ id: 'abc', status: 'pending', amount: 4900, checkout_url: 'https://pay.chargily.dz/x' }), {
        status: 200,
      })
    })
    const result = await createChargilyCheckout({ amountDzd: 4900, successUrl: 'https://x.test/success' })
    expect(result).toEqual({ ok: true, data: { id: 'abc', status: 'pending', amount: 4900, checkoutUrl: 'https://pay.chargily.dz/x' } })
    expect(sentBody).toMatchObject({ amount: 4900, currency: 'dzd' })
  })

  test('uses the test base URL by default, live URL when CHARGILY_MODE=live', async () => {
    process.env.CHARGILY_SECRET_KEY = 'test_sk_fake'
    let calledUrl = ''
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      calledUrl = String(url)
      return new Response(JSON.stringify({ id: 'abc', status: 'pending', amount: 1, checkout_url: 'https://x' }), { status: 200 })
    })

    delete process.env.CHARGILY_MODE
    await createChargilyCheckout({ amountDzd: 1, successUrl: 'https://x.test' })
    expect(calledUrl).toContain('pay.chargily.net/test/api/v2')

    process.env.CHARGILY_MODE = 'live'
    await createChargilyCheckout({ amountDzd: 1, successUrl: 'https://x.test' })
    expect(calledUrl).toBe('https://pay.chargily.net/api/v2/checkouts')
  })
})

describe('verifyChargilySignature', () => {
  const secret = 'test_sk_fake_secret'
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.paid', data: { id: 'chk_1', status: 'paid', amount: 4900 } })

  test('accepts a correctly computed signature', () => {
    const signature = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
    expect(verifyChargilySignature(body, signature, secret)).toBe(true)
  })

  test('rejects a forged signature', () => {
    const forged = createHmac('sha256', 'wrong-secret').update(body, 'utf8').digest('hex')
    expect(verifyChargilySignature(body, forged, secret)).toBe(false)
  })

  test('rejects a signature of a different length without throwing', () => {
    expect(verifyChargilySignature(body, 'deadbeef', secret)).toBe(false)
  })

  test('rejects a missing signature header', () => {
    expect(verifyChargilySignature(body, null, secret)).toBe(false)
  })

  test('rejects a signature that is not valid hex without throwing', () => {
    expect(verifyChargilySignature(body, 'not-hex-!!!!-@@@@', secret)).toBe(false)
  })

  test('a mutated body invalidates a previously valid signature', () => {
    const signature = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
    const tampered = body.replace('"amount":4900', '"amount":100')
    expect(verifyChargilySignature(tampered, signature, secret)).toBe(false)
  })
})
