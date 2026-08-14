import type { NextRequest } from 'next/server'

/** Parses a JSON body, returning null on a malformed/non-JSON body instead of throwing. */
export async function parseJsonBody<T = unknown>(req: NextRequest): Promise<T | null> {
  return req.json().catch(() => null) as Promise<T | null>
}

interface IntParamOptions {
  min?: number
  max?: number
  default: number
}

/**
 * Parses an integer query/body param defensively: non-numeric, non-finite,
 * or out-of-range input falls back to `default` rather than propagating a
 * NaN/negative value into a `.range()` or loop bound.
 */
export function parseIntParam(raw: string | null | undefined, options: IntParamOptions): number {
  if (raw == null) return options.default
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return options.default
  if (options.min !== undefined && n < options.min) return options.default
  if (options.max !== undefined && n > options.max) return options.default
  return n
}

interface DateParamOptions {
  /** Clamps how far apart `from`/`to` may be, to bound loop/query cost on attacker-supplied ranges. */
  maxRangeDays?: number
}

/** Parses a date query param, returning null on an invalid/unparseable date instead of throwing a RangeError downstream. */
export function parseDateParam(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Clamps a `to` date so the range from `from` never exceeds `maxRangeDays` — caps unbounded bucket/loop iteration on a wide-open date range. */
export function clampDateRange(from: Date, to: Date, options: DateParamOptions): Date {
  const maxRangeDays = options.maxRangeDays ?? 366
  const maxMs = maxRangeDays * 24 * 60 * 60 * 1000
  if (to.getTime() - from.getTime() > maxMs) {
    return new Date(from.getTime() + maxMs)
  }
  return to
}

interface StringOptions {
  max?: number
  min?: number
}

/**
 * Validates a required string field, returning a stable error CODE (or null
 * if valid) — never render the return value directly, resolve it first via
 * translateErrorCode() (lib/api/error-messages.ts), mirroring the CODE
 * contract lib/api/errors.ts uses for jsonError/badRequest/etc. The codes
 * returned here (REQUIRED_FIELD, FIELD_TOO_LONG, FIELD_TOO_SHORT) are
 * generic/field-agnostic and already present in the `errors` dictionary
 * namespace (lib/i18n/dictionaries/*\/errors.ts). `field` is kept in the
 * signature for callers that want it for their own logging/context even
 * though it no longer appears in the returned code.
 */
export function requireString(value: unknown, field: string, options: StringOptions = {}): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'REQUIRED_FIELD'
  if (options.max !== undefined && value.length > options.max) return 'FIELD_TOO_LONG'
  if (options.min !== undefined && value.length < options.min) return 'FIELD_TOO_SHORT'
  return null
}
