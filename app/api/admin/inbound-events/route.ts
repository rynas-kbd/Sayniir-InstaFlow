import { NextRequest, NextResponse } from 'next/server'
import { dispatchInboundMessage, dispatchInboundComment } from '@/lib/channels/shared/inbound'
import { listStuckEvents, markEventDone, markEventFailed, tryLockConversation, unlockConversation } from '@/lib/channels/shared/inbound-queue'
import { safeEqualStr } from '@/lib/security/compare'
import type { NormalizedInboundMessage, NormalizedInboundComment } from '@/lib/channels/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const STUCK_AFTER_MS = 2 * 60 * 1000
const MAX_ATTEMPTS = 3

/**
 * GET /api/admin/inbound-events
 * Cron — recovery net for the async webhook pipeline (see inbound.ts's
 * createWebhookRoute + after()). Normally every claimed inbound_events row
 * is marked 'done' by the webhook's own after() callback. This only matters
 * when the serverless instance running after() dies mid-flight (a hard
 * kill, not a graceful timeout) — the row is left 'processing' forever
 * otherwise, and the customer never gets a reply. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !safeEqualStr(authHeader, `Bearer ${cronSecret}`)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stuck = await listStuckEvents(STUCK_AFTER_MS, MAX_ATTEMPTS)
  let recovered = 0

  for (const event of stuck) {
    const isComment = event.message_id.startsWith('comment:')
    try {
      if (isComment) {
        const comment = event.payload as NormalizedInboundComment
        await dispatchInboundComment(comment)
        await markEventDone(event.message_id)
      } else {
        const msg = event.payload as NormalizedInboundMessage
        const locked = await tryLockConversation(msg.channelExternalId, msg.senderId, msg.messageId)
        if (!locked) continue
        try {
          await dispatchInboundMessage(msg)
          await markEventDone(msg.messageId)
        } finally {
          await unlockConversation(msg.channelExternalId, msg.senderId)
        }
      }
      recovered += 1
    } catch (err) {
      console.error(`[inbound-events cron] Failed to recover ${event.message_id}:`, err)
      await markEventFailed(event.message_id, err)
    }
  }

  return NextResponse.json({ recovered, scanned: stuck.length })
}
