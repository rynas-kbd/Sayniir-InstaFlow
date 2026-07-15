import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/products?accountId=...
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

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(products)
}

// POST /api/products
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, name, description, price, sizes, colors, image_url, stock_quantity } = body

  if (!channel_account_id || !name || price === undefined) {
    return NextResponse.json({ error: 'channel_account_id, name et price sont requis' }, { status: 400 })
  }

  // Verify ownership
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channel_account_id)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      channel_account_id,
      name,
      description: description || null,
      price: parseFloat(price),
      sizes: sizes || [],
      colors: colors || [],
      image_url: image_url || null,
      stock_quantity: stock_quantity ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(product, { status: 201 })
}
