import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { jsonError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/auth'

async function ownedCode(supabase: SupabaseClient, id: string, userId: string) {
  const { data } = await supabase
    .from('discount_codes')
    .select('id, channel_accounts!inner(user_id)')
    .eq('id', id)
    .eq('channel_accounts.user_id', userId)
    .single()
  return data
}

// PATCH /api/discount-codes/[id] — { is_active }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth
  const { id } = await params

  const owned = await ownedCode(supabase, id, user.id)
  if (!owned) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  const { data, error } = await supabase.from('discount_codes').update(updates).eq('id', id).select().single()
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(data)
}

// DELETE /api/discount-codes/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth
  const { id } = await params

  const owned = await ownedCode(supabase, id, user.id)
  if (!owned) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { error } = await supabase.from('discount_codes').delete().eq('id', id)
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true })
}
