import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary } from '@/lib/analytics/queries'
import { parseDateParam, clampDateRange } from '@/lib/api/validate'
import { badRequest } from '@/lib/api/errors'

// GET /api/analytics/summary?accountId=...&from=ISO&to=ISO
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', accountId).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const fromParam = request.nextUrl.searchParams.get('from')
  const toParam = request.nextUrl.searchParams.get('to')
  if (fromParam && !parseDateParam(fromParam)) return badRequest('INVALID_FROM_PARAM')
  if (toParam && !parseDateParam(toParam)) return badRequest('INVALID_TO_PARAM')

  const to = toParam ? parseDateParam(toParam)! : new Date()
  const from = fromParam ? parseDateParam(fromParam)! : new Date(to.getTime() - 13 * 86400000)
  // Clamp so a wide-open range can't drive an unbounded day-bucket loop downstream.
  const clampedTo = clampDateRange(from, to, { maxRangeDays: 366 })

  const summary = await getAnalyticsSummary(accountId, from, clampedTo)
  return NextResponse.json(summary)
}
