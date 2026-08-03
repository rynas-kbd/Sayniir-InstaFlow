import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// GET /api/orders?accountId=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  // Verify ownership
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(orders)
}

// Order updates go through PATCH /api/orders/[id] (app/api/orders/[id]/route.ts)
// — that's the route order-table.tsx actually calls. This file previously
// also exported a PATCH /api/orders?id=... with no callers anywhere in the
// codebase; removed rather than left to drift from the real one.
