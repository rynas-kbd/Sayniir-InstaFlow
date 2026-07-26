import { promises as dns } from 'dns'
import { isIP } from 'net'

/**
 * SSRF guard for outbound fetches whose target URL is (partly) user-controlled
 * — e.g. the flow builder's "external_request" node. Validates scheme, blocks
 * credentials-in-URL, and resolves the hostname to reject requests aimed at
 * loopback / private / link-local / reserved address space (this covers the
 * classic 169.254.169.254 cloud-metadata SSRF).
 *
 * Residual risk: this is validate-then-fetch, not connect-time pinning. An
 * attacker who controls DNS with very short TTLs could in principle swap the
 * A record between our lookup and the actual fetch ("DNS rebinding"). Closing
 * that fully requires resolving once and connecting to the pinned IP via a
 * custom dispatcher/agent, which is more invasive than this fix warrants
 * right now. Call sites should still keep aggressive timeouts and response
 * size caps as a second layer.
 */
export class UnsafeUrlError extends Error {}

function ipv4ToInt(parts: number[]): number {
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isPrivateOrReservedIPv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true // malformed → treat as unsafe
  const ip = ipv4ToInt(parts)
  const inRange = (base: string, maskBits: number) => {
    const baseParts = base.split('.').map(Number)
    const baseInt = ipv4ToInt(baseParts)
    const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0
    return (ip & mask) === (baseInt & mask)
  }
  return (
    inRange('0.0.0.0', 8) || // "this" network
    inRange('10.0.0.0', 8) || // private
    inRange('100.64.0.0', 10) || // CGNAT
    inRange('127.0.0.0', 8) || // loopback
    inRange('169.254.0.0', 16) || // link-local (incl. cloud metadata)
    inRange('172.16.0.0', 12) || // private
    inRange('192.0.0.0', 24) || // IETF protocol assignments
    inRange('192.168.0.0', 16) || // private
    inRange('198.18.0.0', 15) || // benchmarking
    inRange('224.0.0.0', 4) || // multicast
    inRange('240.0.0.0', 4) // reserved
  )
}

function isPrivateOrReservedIPv6(address: string): boolean {
  const normalized = address.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fe80:') || normalized.startsWith('fec0:')) return true // link-local
  if (/^fc[0-9a-f]{2}:|^fd[0-9a-f]{2}:/.test(normalized)) return true // unique local (fc00::/7)
  if (normalized.startsWith('ff')) return true // multicast
  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4 address too
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateOrReservedIPv4(mapped[1])
  return false
}

function isUnsafeAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return isPrivateOrReservedIPv4(address)
  if (version === 6) return isPrivateOrReservedIPv6(address)
  return true // couldn't classify → treat as unsafe
}

/**
 * Cheap, synchronous shape check for save-time UI feedback (e.g. validating
 * a flow-builder node config before it's persisted). Catches obviously bad
 * input — wrong scheme, credentials, a literal private/loopback IP — without
 * a DNS round trip. NOT a substitute for assertSafeOutboundUrl() at execution
 * time: a hostname that resolves to a private address today can't be caught
 * here, and DNS answers can change between save and execution anyway.
 * Returns an error message, or null if the shape looks fine.
 */
export function quickUrlShapeCheck(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'Invalid URL'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `Unsupported URL scheme: ${url.protocol}`
  }
  if (url.username || url.password) {
    return 'URLs with embedded credentials are not allowed'
  }
  if (isIP(url.hostname) && isUnsafeAddress(url.hostname)) {
    return `Blocked target address: ${url.hostname}`
  }
  return null
}

/**
 * Throws UnsafeUrlError if `raw` is not a safe outbound target. Returns the
 * parsed URL on success so callers don't need to re-parse it.
 */
export async function assertSafeOutboundUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`Unsupported URL scheme: ${url.protocol}`)
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with embedded credentials are not allowed')
  }

  const hostname = url.hostname
  // Literal IP in the URL — validate directly, no DNS lookup needed.
  if (isIP(hostname)) {
    if (isUnsafeAddress(hostname)) {
      throw new UnsafeUrlError(`Blocked target address: ${hostname}`)
    }
    return url
  }

  let addresses: { address: string }[]
  try {
    addresses = await dns.lookup(hostname, { all: true })
  } catch {
    throw new UnsafeUrlError(`Could not resolve host: ${hostname}`)
  }
  if (addresses.length === 0 || addresses.some((a) => isUnsafeAddress(a.address))) {
    throw new UnsafeUrlError(`Blocked target host: ${hostname}`)
  }

  return url
}
