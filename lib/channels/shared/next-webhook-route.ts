import { NextRequest, NextResponse, after } from 'next/server'
import { handleWebhookRequest } from './handle-webhook'
import type { Platform } from '../types'

/**
 * Builds the GET (verification challenge) + POST (event delivery) handlers
 * for a platform's webhook route under app/api/webhooks/[platform]/route.ts.
 * Thin Next.js adapter around handleWebhookRequest() (handle-webhook.ts) —
 * the framework-free core shared with the Supabase Edge Function equivalent
 * (supabase/functions/instagram-webhook/index.ts), which injects
 * EdgeRuntime.waitUntil instead of next/server's after().
 *
 * Deliberately its own file, not part of lib/channels/shared/inbound.ts:
 * the Edge Function imports inbound.ts transitively (for
 * dispatchInboundMessage/dispatchInboundComment), and Deno's bundler
 * resolves every static import eagerly — a `next/server` import anywhere
 * in that module graph fails the Edge Function's build even though nothing
 * in the actual dispatch path calls it.
 */
export function createWebhookRoute(platform: Platform) {
  async function GET(request: NextRequest) {
    const response = await handleWebhookRequest(platform, request, async () => {})
    return new NextResponse(await response.text(), { status: response.status })
  }

  async function POST(request: NextRequest) {
    const response = await handleWebhookRequest(platform, request, (promise) => after(promise))
    return new NextResponse(await response.text(), { status: response.status })
  }

  return { GET, POST }
}
