import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { safeEqualStr } from '@/lib/security/compare'
import { runBotAutoResume } from '@/lib/contacts/bot-auto-resume'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/bot-auto-resume
 * Resumes the bot for contacts paused > 30 min (see
 * lib/contacts/bot-auto-resume.ts). Triggered by the same
 * .github/workflows/cart-recovery-cron.yml schedule as cart-recovery — the
 * 4 daily Vercel Hobby cron slots are already spoken for (see vercel.json),
 * and a 30-minute threshold needs a far tighter check than once a day
 * anyway. Protégé par CRON_SECRET, comme les autres routes cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !safeEqualStr(authHeader, `Bearer ${cronSecret}`)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runBotAutoResume()
    return NextResponse.json(result)
  } catch (err) {
    return jsonError(500, 'Une erreur est survenue', err)
  }
}
