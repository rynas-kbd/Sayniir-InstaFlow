import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { safeEqualStr } from '@/lib/security/compare'
import { runCartRecoverySweep } from '@/lib/agent/ecommerce/cart-recovery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/admin/cart-recovery
 * Sends the one abandoned-cart reminder a session is allowed within Meta's
 * 24h messaging window (see lib/agent/ecommerce/cart-recovery.ts), then
 * expires sessions that went unanswered past that window. Needs to run far
 * more often than once a day to hit its 1-20h timing window, so unlike the
 * other admin/* routes this isn't on a Vercel cron (the 4 daily Hobby-plan
 * slots are already spoken for — see vercel.json) — it's triggered by
 * .github/workflows/cart-recovery-cron.yml on a tighter schedule. Protégé
 * par CRON_SECRET, comme les autres routes cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !safeEqualStr(authHeader, `Bearer ${cronSecret}`)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runCartRecoverySweep()
    return NextResponse.json(result)
  } catch (err) {
    return jsonError(500, 'Une erreur est survenue', err)
  }
}
