import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requireFlowOwnership } from '@/lib/api/auth'

// GET /api/growth-links?flowId=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const flowId = request.nextUrl.searchParams.get('flowId')
  if (!flowId) return NextResponse.json({ error: 'flowId required' }, { status: 400 })

  const { data: links, error } = await supabase.from('growth_links').select('*').eq('flow_id', flowId).order('created_at', { ascending: false })
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(links ?? [])
}

// POST /api/growth-links — { channel_account_id, flow_id, name }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { channel_account_id, flow_id, name } = body
  if (!channel_account_id || !flow_id || !name?.trim()) {
    return NextResponse.json({ error: 'channel_account_id, flow_id et name sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // flow_id is a foreign key into another tenant's data if unverified — the
  // growth_links RLS policy only constrains channel_account_id, so without
  // this check a growth link can be created pointing at another tenant's
  // flow, which then executes (and sends messages) under that tenant's logic
  // when a visitor opens the link. See lib/channels/shared/inbound.ts.
  const flowOwnership = await requireFlowOwnership(supabase, flow_id, user.id)
  if (flowOwnership !== true) return flowOwnership

  const code = randomBytes(4).toString('hex')

  const { data: link, error } = await supabase
    .from('growth_links')
    .insert({ channel_account_id, flow_id, name: name.trim(), code })
    .select()
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(link, { status: 201 })
}
