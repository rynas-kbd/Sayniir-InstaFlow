import {
  verifyWebhookSignature,
  parseWebhookMessaging,
  parseWebhookComments,
  type WebhookPayload,
} from '../_shared/meta/webhook.ts'
import { handleAutoReply, handleVoiceAutoReply } from '../_shared/meta/messaging.ts'
import { handleCommentAutoReply } from '../_shared/meta/comments.ts'

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // ──────────────────────────────────────────────────────────────
  // GET — Webhook verification challenge (Meta  App setup)
  // ──────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook] ✅ Verification successful')
      return new Response(challenge, { status: 200 })
    }

    console.warn('[Webhook] ❌ Verification failed — invalid token or mode')
    return new Response('Forbidden', { status: 403 })
  }

  // ──────────────────────────────────────────────────────────────
  // POST — Real-time Instagram events
  // ──────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const rawBody = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    const appSecret = Deno.env.get('META_APP_SECRET') ?? ''

    // Verify HMAC-SHA256 signature (now async using Web Crypto API)
    const isValid = await verifyWebhookSignature(rawBody, signature, appSecret)
    if (!isValid) {
      console.warn('[Webhook] ❌ Invalid signature — request rejected')
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse payload
    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[Webhook] Failed to parse JSON body')
      return new Response('Bad Request', { status: 400 })
    }

    // Extract events
    const messagingEvents = parseWebhookMessaging(payload)
    const commentEvents = parseWebhookComments(payload)

    console.log(`[Webhook] 📥 ${messagingEvents.length} messaging + ${commentEvents.length} comment events`)

    // ── Process DM / Voice messages ──────────────────────────────
    for (const { pageId, messaging } of messagingEvents) {
      const { sender, recipient, message } = messaging

      // Skip echo messages (sent BY the account)
      if (sender.id === recipient.id || sender.id === pageId) continue
      if (!message) continue

      try {
        const audioAttachment = message.attachments?.find((att) => att.type === 'audio')

        if (audioAttachment?.payload?.url) {
          console.log(`[Webhook] 🎙️ Voice note — sender=${sender.id} page=${pageId}`)
          await handleVoiceAutoReply({
            pageId,
            senderId: sender.id,
            messageId: message.mid,
            audioUrl: audioAttachment.payload.url,
          })
        } else if (message.text) {
          console.log(`[Webhook] 💬 Text DM — sender=${sender.id} page=${pageId}`)
          await handleAutoReply({
            pageId,
            senderId: sender.id,
            messageId: message.mid,
            messageText: message.text,
          })
        }
      } catch (err) {
        console.error(`[Webhook] Error handling message ${message.mid}:`, err)
      }
    }

    // ── Process Comment events ───────────────────────────────────
    for (const { pageId, comment } of commentEvents) {
      // Skip comments made BY the account itself
      if (comment.from.id === pageId) continue

      try {
        console.log(`[Webhook] 💬 Comment — commenter=${comment.from.id} page=${pageId}`)
        await handleCommentAutoReply({
          pageId,
          commentId: comment.id,
          commenterId: comment.from.id,
          commenterUsername: comment.from.username,
          messageText: comment.text,
          mediaId: comment.media?.id,
        })
      } catch (err) {
        console.error(`[Webhook] Error handling comment ${comment.id}:`, err)
      }
    }

    return new Response('EVENT_RECEIVED', { status: 200 })
  }

  return new Response('Method Not Allowed', { status: 405 })
})
