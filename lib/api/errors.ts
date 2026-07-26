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
