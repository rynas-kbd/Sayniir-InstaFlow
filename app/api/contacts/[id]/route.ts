import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// GET /api/contacts/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*, contact_tags(tag_id, tags(id, name, color))')
    .eq('id', id)
    .single()

  if (error) return jsonError(404, 'Contact introuvable', error)
  return NextResponse.json(contact)
}

// PATCH /api/contacts/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const allowed = ['full_name', 'phone', 'email', 'is_subscribed', 'custom_fields', 'bot_paused', 'assigned_to']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  // Stamped so the auto-resume sweep (lib/jobs/bot-auto-resume.ts) knows
  // how long a conversation has been paused — cleared on manual resume too.
  if ('bot_paused' in body) updates.bot_paused_at = body.bot_paused ? new Date().toISOString() : null

  const { data: contact, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single()
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(contact)
}

// DELETE /api/contacts/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: deleted, error } = await supabase.from('contacts').delete().eq('id', id).select('id')
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!deleted || deleted.length === 0) return jsonError(404, 'Contact introuvable')
  return NextResponse.json({ success: true })
}
