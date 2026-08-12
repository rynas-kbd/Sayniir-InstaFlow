import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Manual post↔product linking — the "rattachement manuel" side of
 * Vérification de disponibilité (see lib/agent/ecommerce/post-resolver.ts
 * for the automatic RapidAPI-cache side). Lets a merchant fix a resolution
 * the automatic path got wrong, or pre-link a post before any customer ever
 * shares it.
 */

// GET /api/products/[id]/posts
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // RLS (product_posts → products → channel_accounts → auth.uid(), see
  // the 20260902000000 migration) already scopes this to the caller's own
  // products — a product_id belonging to someone else just returns no rows.
  const { data, error } = await supabase
    .from('product_posts')
    .select('id, media_id, shortcode, permalink, caption, source')
    .eq('product_id', id)
    .order('created_at', { ascending: false })

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ data: data ?? [] })
}

// PUT /api/products/[id]/posts — replaces the full set of manually-linked posts for this product.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const posts: unknown[] = Array.isArray(body.posts) ? body.posts : []

  // Same ownership convention as PATCH /api/products/[id]: RLS on `products`
  // means this select only ever returns a row the caller actually owns.
  const { data: product, error: productError } = await supabase.from('products').select('id, channel_account_id').eq('id', id).maybeSingle()
  if (productError) return jsonError(500, 'Une erreur est survenue', productError)
  if (!product) return jsonError(404, 'Produit introuvable')

  // Manual links are fully replaced by this call — cache rows the RapidAPI
  // resolver writes on its own (source='rapidapi_cache') are left alone, so
  // this endpoint only ever touches what the merchant explicitly set here.
  const { error: deleteError } = await supabase.from('product_posts').delete().eq('product_id', id).eq('source', 'manual')
  if (deleteError) return jsonError(500, 'Une erreur est survenue', deleteError)

  const linked: string[] = []
  const skipped: string[] = []

  for (const post of posts) {
    const mediaId = typeof (post as { mediaId?: unknown })?.mediaId === 'string' ? (post as { mediaId: string }).mediaId : null
    if (!mediaId) continue

    const permalink = typeof (post as { permalink?: unknown })?.permalink === 'string' ? (post as { permalink: string }).permalink : null
    const caption = typeof (post as { caption?: unknown })?.caption === 'string' ? (post as { caption: string }).caption : null

    const { error: insertError } = await supabase.from('product_posts').insert({
      product_id: id,
      channel_account_id: product.channel_account_id,
      media_id: mediaId,
      permalink,
      caption,
      source: 'manual',
    })

    if (insertError) {
      // 23505 = this post is already linked to a DIFFERENT product for this
      // shop (the partial unique index on (channel_account_id, media_id)) —
      // report it back instead of failing the whole request.
      if (insertError.code === '23505') skipped.push(mediaId)
      else return jsonError(500, 'Une erreur est survenue', insertError)
    } else {
      linked.push(mediaId)
    }
  }

  return NextResponse.json({ linked, skipped })
}
