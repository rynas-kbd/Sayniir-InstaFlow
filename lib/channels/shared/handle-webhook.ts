import { getAdapter } from '../registry'
import { safeEqualStr } from '../../security/compare'
import { claimInboundEvent, markEventDone, markEventFailed, tryLockConversation, unlockConversation } from './inbound-queue'
import { dispatchInboundMessage, dispatchInboundComment } from './inbound'
import { findChannelAccountByExternalId, resolveWhatsAppAppSecret } from './lookup'
import type { Platform } from '../types'

const VERIFY_TOKEN_ENV: Record<Platform, string> = {
  instagram: 'META_WEBHOOK_VERIFY_TOKEN',
  messenger: 'META_MESSENGER_VERIFY_TOKEN',
  whatsapp: 'META_WHATSAPP_VERIFY_TOKEN',
}

// Instagram/Messenger accounts all connect through our one shared app, so
// their signing secret is a single global env var. WhatsApp accounts can
// now be manually admin-connected through a CLIENT's own Meta app (see
// 20260901020000_whatsapp_manual_connect.sql) — resolveWhatsAppAppSecret()
// below resolves that per-account, falling back to this same global value.
const APP_SECRET_ENV: Record<Platform, string> = {
  instagram: 'META_INSTAGRAM_APP_SECRET',
  messenger: 'META_MESSENGER_APP_SECRET',
  whatsapp: 'META_APP_SECRET',
}

/**
 * Runtime-agnostic core of the Meta webhook handler — Web-standard
 * Request/Response only, no next/server import. Shared by the Next.js API
 * route (lib/channels/shared/inbound.ts::createWebhookRoute, which injects
 * next/server's `after`) and the Supabase Edge Function (which injects
 * `EdgeRuntime.waitUntil`).
 *
 * `waitUntil` lets the caller keep the function/isolate alive long enough
 * for the dispatch work below to finish after the response has been sent —
 * Meta needs a fast 200 or it redelivers, but dispatchInboundMessage
 * (1-2 LLM calls + ~10 DB round-trips) routinely takes longer than that.
 */
export function handleWebhookRequest(
  platform: Platform,
  request: Request,
  waitUntil: (promise: Promise<unknown>) => void
): Promise<Response> {
  if (request.method === 'GET') return handleChallenge(platform, request)
  if (request.method === 'POST') return handleEvent(platform, request, waitUntil)
  return Promise.resolve(new Response('Method Not Allowed', { status: 405 }))
}

async function handleChallenge(platform: Platform, request: Request): Promise<Response> {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  const verifyToken = process.env[VERIFY_TOKEN_ENV[platform]]

  if (mode === 'subscribe' && safeEqualStr(token, verifyToken)) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

async function handleEvent(
  platform: Platform,
  request: Request,
  waitUntil: (promise: Promise<unknown>) => void
): Promise<Response> {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = platform === 'whatsapp' ? await resolveWhatsAppAppSecret(rawBody) : process.env[APP_SECRET_ENV[platform]]
  const adapter = getAdapter(platform)

  // Fail closed when the app secret isn't configured — computing the HMAC
  // with an empty-string key (the previous `?? ''` fallback) means anyone
  // can compute a "valid" signature for a forged payload.
  if (!appSecret) {
    console.error(`[webhook:${platform}] ${APP_SECRET_ENV[platform]} is not configured`)
    return new Response('Service Unavailable', { status: 503 })
  }

  if (!(await adapter.verifyWebhookSignature(rawBody, signature, appSecret))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const messages = adapter.parseWebhookMessages(payload)
  const comments = adapter.parseWebhookComments(payload)

  // Claim each message's Meta `mid` BEFORE doing any real work. This is
  // the actual fix for "every bot reply sent 2-3 times": Meta redelivers
  // a message it didn't get a fast 200 for, and dispatchInboundMessage
  // (1-2 LLM calls + ~10 DB round-trips) routinely took long enough to
  // trigger exactly that. Claiming is a single fast insert, so it's safe
  // to do synchronously here; the actual dispatch moves to waitUntil below
  // so Meta gets its 200 without waiting on the LLM at all. A duplicate
  // `mid` (redelivery) fails the claim and is silently skipped.
  const newMessages: typeof messages = []
  for (const msg of messages) {
    const claimed = await claimInboundEvent(msg.messageId, platform, msg)
    if (claimed) newMessages.push(msg)
  }

  const newComments: typeof comments = []
  for (const comment of comments) {
    const claimed = await claimInboundEvent(`comment:${comment.commentId}`, platform, comment)
    if (claimed) newComments.push(comment)
  }

  waitUntil(
    (async () => {
      for (const msg of newMessages) {
        // try_lock_conversation's p_channel_account_id column is a UUID
        // (channel_accounts.id) — msg.channelExternalId is Meta's page_id /
        // phone_number_id (e.g. "17841…"), never a UUID. Passing it directly
        // used to make every lock attempt fail with a Postgres cast error,
        // which silently dropped the message (see F1 in the conversational
        // audit): resolve the actual account row first.
        const account = await findChannelAccountByExternalId(platform, msg.channelExternalId)
        if (!account) {
          console.warn(`[webhook:${platform}] No active account for ${msg.channelExternalId} — dropping message ${msg.messageId}`)
          await markEventDone(msg.messageId)
          continue
        }

        // Serializes turns for the same (channel, sender) pair — this is
        // what stops two near-simultaneous messages (or a redelivery that
        // slipped in before the claim above) from racing on the same
        // order_sessions row and silently overwriting each other's slots.
        const locked = await tryLockConversation(account.id, msg.senderId, msg.messageId)
        if (!locked) continue // left 'processing' — the recovery sweep retries it shortly
        try {
          await dispatchInboundMessage(msg)
          await markEventDone(msg.messageId)
        } catch (err) {
          console.error(`[webhook:${platform}] Error handling message ${msg.messageId}:`, err)
          await markEventFailed(msg.messageId, err)
        } finally {
          await unlockConversation(account.id, msg.senderId)
        }
      }

      for (const comment of newComments) {
        try {
          await dispatchInboundComment(comment)
          await markEventDone(`comment:${comment.commentId}`)
        } catch (err) {
          console.error(`[webhook:${platform}] Error handling comment ${comment.commentId}:`, err)
          await markEventFailed(`comment:${comment.commentId}`, err)
        }
      }
    })()
  )

  return new Response('EVENT_RECEIVED', { status: 200 })
}
