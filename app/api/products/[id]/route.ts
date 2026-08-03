import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/products/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const allowed = ['name', 'description', 'price', 'currency', 'kind', 'metadata', 'sizes', 'colors', 'image_url', 'images', 'category', 'stock_quantity', 'is_active']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  // RLS ensures user can only update their own products
  const { data: product, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(product)
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: deleted, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!deleted || deleted.length === 0) return jsonError(404, 'Produit introuvable')
  return NextResponse.json({ success: true })
}
