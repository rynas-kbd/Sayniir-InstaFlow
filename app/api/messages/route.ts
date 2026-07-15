import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/messages
 * Returns recent message logs for the authenticated user (paginated).
 * Query params: ?page=1&limit=20
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = (page - 1) * limit

  // Get accounts owned by this user first
  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user.id)

  const accountIds = (accounts ?? []).map((a) => a.id)

  if (accountIds.length === 0) {
    return NextResponse.json({ messages: [], total: 0, page, limit })
  }

  const { data: messages, error, count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact' })
    .in('channel_account_id', accountIds)
    .eq('direction', 'incoming')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[GET /api/messages]', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json({
    messages: messages ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}
