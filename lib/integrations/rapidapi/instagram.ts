/**
 * RapidAPI-backed Instagram media lookup — resolves a shared post's
 * shortcode/media id/URL to its caption, so lib/agent/ecommerce/post-resolver.ts
 * can match that caption against the shop's catalog (lib/agent/ecommerce/product-match.ts).
 *
 * This is the first third-party API integration in the repo (see the
 * codebase audit: no rapidapi/x-rapidapi reference existed anywhere before
 * this file). Deliberately isolated behind this module — nothing else
 * should import RAPIDAPI_KEY directly — so swapping providers later touches
 * one file.
 *
 * Never throws: every failure mode (missing config, no usable identifier,
 * timeout, HTTP error, unparseable body) is a typed `{ ok: false }` result.
 * The caller (post-resolver.ts) degrades to "cache only" rather than
 * guessing — see requirement: "ne jamais inventer la disponibilité ou les
 * informations d'un produit".
 */

const REQUEST_TIMEOUT_MS = 6_000
const MAX_RETRIES = 1
const MAX_RESPONSE_BYTES = 64 * 1024
const DEFAULT_HOST = 'instagram-scraper-api2.p.rapidapi.com'

export interface ResolvedMedia {
  mediaId?: string
  shortcode?: string
  caption?: string
  permalink?: string
}

export type MediaLookup =
  | { ok: true; media: ResolvedMedia }
  | { ok: false; reason: 'not_configured' | 'no_identifier' | 'timeout' | 'http_error' | 'unparseable'; detail?: string }

class RapidApiHttpError extends Error {
  constructor(public readonly status: number, body: string) {
    super(`RapidAPI ${status}: ${body}`)
  }
}

/** Mirrors lib/flows/nodes.ts's readCapped — bounds memory on a response regardless of what the remote host declares. */
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

/** Same retry shape as lib/agent/engine.ts's withRetry — timeout/429/5xx only, exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError'
      const status = err instanceof RapidApiHttpError ? err.status : undefined
      const isRetryable = isTimeout || status === 429 || (status !== undefined && status >= 500)
      if (!isRetryable || attempt > MAX_RETRIES) throw lastErr
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
  }
  throw lastErr
}

/** `/p/<shortcode>/` or `/reel/<shortcode>/` — the only two Instagram permalink shapes that carry a shortcode. */
export function extractShortcodeFromUrl(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i)
  return match ? match[1] : null
}

/**
 * Tolerant of the handful of response shapes RapidAPI Instagram providers
 * tend to use (flat, or nested under `data`/`result`) — this is the one
 * place that would need updating if the configured provider's shape differs.
 */
function normalizeMedia(json: unknown): ResolvedMedia | null {
  if (typeof json !== 'object' || json === null) return null
  const root = json as Record<string, unknown>
  const data = (typeof root.data === 'object' && root.data !== null ? root.data : root.result && typeof root.result === 'object' ? root.result : root) as Record<
    string,
    unknown
  >

  const caption =
    typeof data.caption === 'string'
      ? data.caption
      : typeof data.caption_text === 'string'
        ? data.caption_text
        : typeof (data.caption as Record<string, unknown> | undefined)?.text === 'string'
          ? ((data.caption as Record<string, unknown>).text as string)
          : undefined

  const media: ResolvedMedia = {
    mediaId: typeof data.id === 'string' ? data.id : typeof data.pk === 'string' || typeof data.pk === 'number' ? String(data.pk) : undefined,
    shortcode: typeof data.shortcode === 'string' ? data.shortcode : typeof data.code === 'string' ? data.code : undefined,
    caption,
    permalink: typeof data.permalink === 'string' ? data.permalink : undefined,
  }

  return media.mediaId || media.shortcode || media.caption ? media : null
}

export async function lookupInstagramMedia(input: { shortcode?: string; mediaId?: string; url?: string }): Promise<MediaLookup> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return { ok: false, reason: 'not_configured' }

  const host = process.env.RAPIDAPI_INSTAGRAM_HOST || DEFAULT_HOST
  const shortcode = input.shortcode ?? (input.url ? extractShortcodeFromUrl(input.url) ?? undefined : undefined)
  const mediaId = input.mediaId

  if (!shortcode && !mediaId) return { ok: false, reason: 'no_identifier' }

  const query = new URLSearchParams(shortcode ? { shortcode } : { id: mediaId! })

  try {
    const media = await withRetry(async () => {
      const res = await fetch(`https://${host}/v1/media_info?${query.toString()}`, {
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!res.ok) {
        const body = await readCapped(res, MAX_RESPONSE_BYTES)
        throw new RapidApiHttpError(res.status, body)
      }

      const text = await readCapped(res, MAX_RESPONSE_BYTES)
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error('unparseable_json')
      }

      const normalized = normalizeMedia(json)
      if (!normalized) throw new Error('unparseable_shape')
      return normalized
    })

    return { ok: true, media }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      console.error('[RapidAPI:instagram] Timed out resolving media', { shortcode, mediaId })
      return { ok: false, reason: 'timeout' }
    }
    if (err instanceof RapidApiHttpError) {
      console.error('[RapidAPI:instagram] HTTP error resolving media', { status: err.status, shortcode, mediaId })
      return { ok: false, reason: 'http_error', detail: String(err.status) }
    }
    console.error('[RapidAPI:instagram] Unparseable response', { shortcode, mediaId, error: err instanceof Error ? err.message : String(err) })
    return { ok: false, reason: 'unparseable' }
  }
}
