import { NextRequest, NextResponse } from 'next/server'
import { checkAndRefreshTokens } from '@/lib/meta/token-refresh'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/refresh-tokens
 * Cron job — proactively refreshes Instagram long-lived tokens expiring
 * within 7 days. Was previously never wired to any cron (checkAndRefreshTokens
 * existed but nothing called it — found during the multi-canal generalization).
 * WhatsApp System User tokens are permanent (no refresh needed); Messenger
 * Page tokens follow the same Facebook long-lived token lifecycle as
 * Instagram and can reuse this same job once Phase 2 accounts are live.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await checkAndRefreshTokens()
  return NextResponse.json({ ok: true })
}
