import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { propagateProductUpsert, propagateProductDelete } from '@/lib/boutique/sync'

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

  // Read the name BEFORE updating — a rename needs the sibling lookup in
  // propagateProductUpsert to still find the old row by its old name.
  const previousName: string | null =
    typeof updates.name === 'string'
      ? (await supabase.from('products').select('name').eq('id', id).maybeSingle()).data?.name ?? null
      : null

  // RLS ensures user can only update their own products
  const { data: product, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)

  // Awaited directly — see app/api/products/route.ts's comment on why after() isn't used here.
  try {
    await propagateProductUpsert(
      supabase,
      product.channel_account_id,
      {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        kind: product.kind,
        sizes: product.sizes,
        colors: product.colors,
        image_url: product.image_url,
        images: product.images,
        category: product.category,
        metadata: product.metadata,
        track_stock: product.track_stock,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
      },
      previousName
    )
  } catch (err) {
    console.error('[products] Boutique sync propagation failed:', err)
  }

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
    .select('id, channel_account_id, name')

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!deleted || deleted.length === 0) return jsonError(404, 'Produit introuvable')

  const [removed] = deleted
  try {
    await propagateProductDelete(supabase, removed.channel_account_id, removed.name)
  } catch (err) {
    console.error('[products] Boutique sync propagation failed:', err)
  }

  return NextResponse.json({ success: true })
}
