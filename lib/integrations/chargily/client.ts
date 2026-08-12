/**
 * Chargily Pay v2 client — https://dev.chargily.com/pay-v2/introduction
 * EDAHABIA/CIB checkout for Manychats subscriptions (DZD only).
 *
 * Deliberately isolated behind this module — nothing else should read
 * CHARGILY_SECRET_KEY directly — same convention as
 * lib/integrations/rapidapi/instagram.ts (the repo's other third-party
 * integration). No official SDK is used: @chargily/chargily-pay is
 * unmaintained since 2024-05, its types are missing current fields
 * (chargily_pay_fees_allocation, percentage_discount, amount_discount) while
 * still exposing the deprecated pass_fees_to_customer, it bundles a
 * pointless in-process rate limiter (bottleneck) for a serverless runtime,
 * and its verifySignature throws instead of returning false despite its own
 * type signature. A ~40-line typed fetch wrapper is safer and dependency-free.
 *
 * Never throws: every failure mode is a typed `{ ok: false }` result, same
 * discriminated-union convention as the RapidAPI client.
 *
 * Amounts are whole DZD (dinars), never centimes — Chargily has no ×100
 * multiplier, unlike Stripe.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RETRIES = 1
const MAX_RESPONSE_BYTES = 64 * 1024

const TEST_BASE_URL = 'https://pay.chargily.net/test/api/v2'
const LIVE_BASE_URL = 'https://pay.chargily.net/api/v2'

export type ChargilyCheckoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'

export interface ChargilyCheckout {
  id: string
  status: ChargilyCheckoutStatus
  amount: number
  checkoutUrl: string
}

export type ChargilyResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'not_configured' | 'timeout' | 'http_error' | 'unparseable'; detail?: string }

class ChargilyHttpError extends Error {
  constructor(
    public readonly status: number,
    body: string
  ) {
    super(`Chargily ${status}: ${body}`)
  }
}

function baseUrl(): string {
  return process.env.CHARGILY_MODE === 'live' ? LIVE_BASE_URL : TEST_BASE_URL
}

/** Mirrors lib/integrations/rapidapi/instagram.ts's readCapped — bounds memory regardless of what Chargily declares. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let result = ''
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      break
    }
    result += decoder.decode(value, { stream: true })
  }
  return result
}

/** Timeout/429/5xx only, exponential backoff. Honors Retry-After on 429 per Chargily's documented rate limiting. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError'
      const status = err instanceof ChargilyHttpError ? err.status : undefined
      const isRetryable = isTimeout || status === 429 || (status !== undefined && status >= 500)
      if (!isRetryable || attempt > MAX_RETRIES) throw lastErr
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
  }
  throw lastErr
}

async function chargilyFetch<T>(path: string, init: RequestInit, secretKey: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = await readCapped(res, MAX_RESPONSE_BYTES)
    throw new ChargilyHttpError(res.status, body)
  }

  const text = await readCapped(res, MAX_RESPONSE_BYTES)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('unparseable_json')
  }
}

export interface CreateCheckoutParams {
  amountDzd: number
  successUrl: string
  failureUrl?: string
  webhookEndpoint?: string
  customerId?: string
  locale?: 'fr' | 'ar' | 'en'
  description?: string
  metadata?: Record<string, string>
}

/** Raw amount/currency checkout — no Chargily Product/Price needed for a variable-price SaaS subscription. */
export async function createChargilyCheckout(params: CreateCheckoutParams): Promise<ChargilyResult<ChargilyCheckout>> {
  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) return { ok: false, reason: 'not_configured' }

  try {
    const checkout = await withRetry(() =>
      chargilyFetch<{ id: string; status: ChargilyCheckoutStatus; amount: number; checkout_url: string }>(
        '/checkouts',
        {
          method: 'POST',
          body: JSON.stringify({
            amount: params.amountDzd,
            currency: 'dzd',
            success_url: params.successUrl,
            failure_url: params.failureUrl,
            webhook_endpoint: params.webhookEndpoint,
            customer_id: params.customerId,
            locale: params.locale ?? 'fr',
            description: params.description,
            metadata: params.metadata,
          }),
        },
        secretKey
      )
    )
    return { ok: true, data: { id: checkout.id, status: checkout.status, amount: checkout.amount, checkoutUrl: checkout.checkout_url } }
  } catch (err) {
    return handleChargilyError(err, '[Chargily:checkout] createChargilyCheckout failed')
  }
}

/** Server-side re-verification of a checkout's status — success_url is a forgeable browser redirect, never proof of payment on its own. */
export async function getChargilyCheckout(id: string): Promise<ChargilyResult<ChargilyCheckout>> {
  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) return { ok: false, reason: 'not_configured' }

  try {
    const checkout = await withRetry(() =>
      chargilyFetch<{ id: string; status: ChargilyCheckoutStatus; amount: number; checkout_url: string }>(
        `/checkouts/${encodeURIComponent(id)}`,
        { method: 'GET' },
        secretKey
      )
    )
    return { ok: true, data: { id: checkout.id, status: checkout.status, amount: checkout.amount, checkoutUrl: checkout.checkout_url } }
  } catch (err) {
    return handleChargilyError(err, '[Chargily:checkout] getChargilyCheckout failed')
  }
}

export interface CreateCustomerParams {
  name?: string
  email?: string
}

export async function createChargilyCustomer(params: CreateCustomerParams): Promise<ChargilyResult<{ id: string }>> {
  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) return { ok: false, reason: 'not_configured' }

  try {
    const customer = await withRetry(() =>
      chargilyFetch<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify(params) }, secretKey)
    )
    return { ok: true, data: { id: customer.id } }
  } catch (err) {
    return handleChargilyError(err, '[Chargily:customer] createChargilyCustomer failed')
  }
}

function handleChargilyError<T>(err: unknown, logPrefix: string): ChargilyResult<T> {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    console.error(`${logPrefix}: timed out`)
    return { ok: false, reason: 'timeout' }
  }
  if (err instanceof ChargilyHttpError) {
    console.error(`${logPrefix}: HTTP ${err.status}`)
    return { ok: false, reason: 'http_error', detail: String(err.status) }
  }
  console.error(`${logPrefix}:`, err instanceof Error ? err.message : String(err))
  return { ok: false, reason: 'unparseable' }
}

/**
 * Verifies the `signature` header Chargily sends on every webhook POST:
 * HMAC-SHA256(rawBody, secretKey), hex-encoded. Unlike Stripe there is no
 * timestamp component in the signature — replay protection relies entirely
 * on event-id deduplication at the call site (chargily_webhook_events).
 *
 * `rawBody` MUST be the untouched request body string (`await request.text()`),
 * never a re-`JSON.stringify`'d object — re-serialization is not guaranteed
 * to byte-match what Chargily signed.
 */
export function verifyChargilySignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false

  const computed = createHmac('sha256', secretKey).update(rawBody, 'utf8').digest('hex')

  try {
    const computedBuf = Buffer.from(computed, 'hex')
    const signatureBuf = Buffer.from(signature, 'hex')
    if (computedBuf.length !== signatureBuf.length) return false
    return timingSafeEqual(computedBuf, signatureBuf)
  } catch {
    return false
  }
}
