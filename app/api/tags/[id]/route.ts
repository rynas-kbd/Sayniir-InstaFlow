import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/tags/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const allowed = ['name', 'color']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data: tag, error } = await supabase.from('tags').update(updates).eq('id', id).select().single()
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(tag)
}

// DELETE /api/tags/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: deleted, error } = await supabase.from('tags').delete().eq('id', id).select('id')
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!deleted || deleted.length === 0) return jsonError(404, 'Tag introuvable')
  return NextResponse.json({ success: true })
}
