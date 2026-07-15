import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flows/[id] — flow + nodes + edges
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [{ data: flow, error }, { data: nodes }, { data: edges }] = await Promise.all([
    supabase.from('flows').select('*').eq('id', id).single(),
    supabase.from('flow_nodes').select('*').eq('flow_id', id),
    supabase.from('flow_edges').select('*').eq('flow_id', id),
  ])

  if (error || !flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  return NextResponse.json({ ...flow, nodes: nodes ?? [], edges: edges ?? [] })
}

// PATCH /api/flows/[id] — status/name/trigger update
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const allowed = ['name', 'status', 'trigger_type', 'trigger_keywords', 'target_post_ids', 'priority']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  const { data: flow, error } = await supabase.from('flows').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(flow)
}

// DELETE /api/flows/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('flows').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
