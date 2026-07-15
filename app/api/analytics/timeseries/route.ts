import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMessagesTimeseries } from '@/lib/analytics/queries'

// GET /api/analytics/timeseries?from=ISO&to=ISO
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fromParam = request.nextUrl.searchParams.get('from')
  const toParam = request.nextUrl.searchParams.get('to')
  const to = toParam ? new Date(toParam) : new Date()
  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 13 * 86400000)

  const points = await getMessagesTimeseries(user.id, from, to)
  return NextResponse.json(points)
}
