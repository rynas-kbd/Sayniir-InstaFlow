import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * Standard error response for API routes. Logs the full error server-side
 * with a correlation ref and returns only a stable, English, machine-readable
 * error CODE to the client (e.g. `ACCOUNT_NOT_FOUND`) — never raw prose and
 * never raw Postgres/PostgREST error text (`error.message`), which exposes
 * constraint, column, and policy names and should never reach the caller
 * directly. Clients translate the code via `translateErrorCode()`
 * (lib/api/error-messages.ts) before showing it to a user.
 *
 * `code` should be a stable identifier, not free text — reuse an existing
 * code from lib/i18n/dictionaries/*\/errors.ts where the situation already
 * has one (e.g. `SERVER_ERROR` for an unexpected failure) instead of minting
 * a new one-off.
 */
export function jsonError(status: number, code: string, err?: unknown): NextResponse {
  const ref = randomUUID().slice(0, 8)
  if (err !== undefined) {
    console.error(`[${ref}] ${code}:`, err)
  }
  return NextResponse.json({ error: code, ref }, { status })
}

/** 401 — no authenticated user. Always paired with a `ref` so responses are shape-consistent with jsonError. */
export function unauthorized(): NextResponse {
  return jsonError(401, 'UNAUTHORIZED')
}

/** 403 — authenticated, but the resource does not belong to this user. */
export function forbidden(): NextResponse {
  return jsonError(403, 'FORBIDDEN')
}

/** 400 — malformed or missing request input. `code` should stay specific (e.g. `ACCOUNT_ID_REQUIRED`). */
export function badRequest(code: string): NextResponse {
  return jsonError(400, code)
}

/** 404 — resource not found (or not visible to this user, which should read the same from the outside). */
export function notFound(code: string): NextResponse {
  return jsonError(404, code)
}
