import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * Standard error response for API routes. Logs the full error server-side
 * with a correlation ref and returns only a generic public message to the
 * client — raw Postgres/PostgREST error text (`error.message`) exposes
 * constraint, column, and policy names and should never reach the caller
 * directly.
 *
 * Not a replacement for deliberate validation messages (e.g. "accountId
 * requis") — those are intentionally specific and stay as plain
 * NextResponse.json calls at their call sites.
 */
export function jsonError(status: number, publicMessage: string, err?: unknown): NextResponse {
  const ref = randomUUID().slice(0, 8)
  if (err !== undefined) {
    console.error(`[${ref}] ${publicMessage}:`, err)
  }
  return NextResponse.json({ error: publicMessage, ref }, { status })
}

/** 401 — no authenticated user. Always paired with a `ref` so responses are shape-consistent with jsonError. */
export function unauthorized(): NextResponse {
  return jsonError(401, 'Authentification requise')
}

/** 403 — authenticated, but the resource does not belong to this user. */
export function forbidden(): NextResponse {
  return jsonError(403, 'Accès refusé')
}

/** 400 — malformed or missing request input. `publicMessage` should stay specific (e.g. "channel_account_id requis"). */
export function badRequest(publicMessage: string): NextResponse {
  return jsonError(400, publicMessage)
}

/** 404 — resource not found (or not visible to this user, which should read the same from the outside). */
export function notFound(publicMessage: string): NextResponse {
  return jsonError(404, publicMessage)
}
