import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidShopifyDomain } from '@/lib/security/shopify-domain'
import { jsonError } from '@/lib/api/errors'
import { decryptApiKey, isEncrypted } from '@/lib/crypto'

interface ShopifyVariant {
  price: string
  inventory_quantity: number | null
}
interface ShopifyOption {
  name: string
  values: string[]
}
interface ShopifyProduct {
  id: number
  title: string
  body_html: string | null
  variants: ShopifyVariant[]
  images: { src: string }[]
  options: ShopifyOption[]
}

// POST /api/shopify/sync — Body: { accountId } — pulls the store's product catalog
// into the app's own `products` table. Upserts on (channel_account_id,
// shopify_product_id) instead of the previous delete-then-insert, which wiped
// every manually-added product and reset kind/metadata/currency (never set
// by this sync) on every single run.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accountId } = await request.json().catch(() => ({}))
  if (!accountId) return NextResponse.json({ error: 'accountId requis' }, { status: 400 })

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: connection } = await supabase
    .from('shopify_connections')
    .select('shop_domain, access_token')
    .eq('channel_account_id', accountId)
    .maybeSingle()
  if (!connection) return NextResponse.json({ error: 'Aucune boutique Shopify connectée.' }, { status: 400 })

  // Re-validate on every read, not just at connect time — a row persisted
  // before this check existed (or written directly) must not keep firing.
  if (!isValidShopifyDomain(connection.shop_domain)) {
    return NextResponse.json({ error: 'Domaine Shopify enregistré invalide. Reconnectez la boutique.' }, { status: 400 })
  }

  // Rows written before encryption was introduced are still plaintext —
  // isEncrypted only unwraps values that actually carry the encrypted
  // envelope, same backward-compat convention as resolveAccessToken.
  const shopifyToken = isEncrypted(connection.access_token)
    ? await decryptApiKey(connection.access_token)
    : connection.access_token

  const res = await fetch(`https://${connection.shop_domain}/admin/api/2024-01/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': shopifyToken },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Impossible de récupérer les produits Shopify.' }, { status: 502 })
  }
  const { products: shopifyProducts }: { products: ShopifyProduct[] } = await res.json()

  const mapped = shopifyProducts.map((p) => normalizeShopifyProduct(p, accountId))

  const { data: inserted, error } = mapped.length
    ? await supabase.from('products').upsert(mapped, { onConflict: 'channel_account_id,shopify_product_id' }).select()
    : { data: [], error: null }
  if (error) return jsonError(500, "Impossible d'importer les produits Shopify", error)

  await supabase
    .from('shopify_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('channel_account_id', accountId)

  return NextResponse.json({ synced: inserted?.length ?? 0, products: inserted })
}

function normalizeShopifyProduct(p: ShopifyProduct, accountId: string) {
  const firstVariant = p.variants[0]
  const stock = p.variants.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0)
  const sizeOption = p.options.find((o) => /size|taille/i.test(o.name))
  const colorOption = p.options.find((o) => /colou?r|couleur/i.test(o.name))

  return {
    channel_account_id: accountId,
    shopify_product_id: String(p.id),
    name: p.title,
    description: p.body_html ? p.body_html.replace(/<[^>]*>/g, '').trim() || null : null,
    price: firstVariant ? parseFloat(firstVariant.price) : 0,
    sizes: sizeOption?.values ?? [],
    colors: colorOption?.values ?? [],
    image_url: p.images[0]?.src ?? null,
    stock_quantity: stock,
    is_active: true,
  }
}
