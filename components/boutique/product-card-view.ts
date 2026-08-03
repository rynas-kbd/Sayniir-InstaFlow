import type { Product, ProductKind, ProductMetadata } from './types'
import type { ProductFormState } from './product-form/types'
import { buildMetadata } from './product-form/product-form-schema'

/** Display-ready shape consumed by <ProductCard/> — one adapter from a saved Product (grid),
 *  one from live form state (create/edit preview). Keeping this pure and JSX/lucide-free lets
 *  it be unit-tested under vitest's `node` environment. */
export interface ProductCardView {
  kind: ProductKind
  name: string
  description: string | null
  price: number | null
  currency: string
  imageUrl: string | null
  stockQuantity: number
  optionBadges: string[]
  /** Writable via the API since day one but never surfaced in the grid — an inactive product looked identical to an active one. */
  isActive: boolean
}

interface OptionBadgeInput {
  kind: ProductKind
  sizes: string[]
  colors: string[]
  metadata: ProductMetadata
}

/** Lifted verbatim from product-table.tsx — the single copy. Note `!= null` (not truthiness) on
 * `remaining`: a sold-out event (remaining: 0) must still surface "0 places restantes". */
export function deriveOptionBadges({ kind, sizes, colors, metadata }: OptionBadgeInput): string[] {
  switch (kind) {
    case 'physical':
      return [...sizes, ...colors]
    case 'service':
      return [
        ...(metadata.duration_minutes ? [`${metadata.duration_minutes} min`] : []),
        ...(metadata.location ? [metadata.location] : []),
      ]
    case 'subscription':
      return [metadata.billing_period === 'yearly' ? 'Facturation annuelle' : 'Facturation mensuelle']
    case 'event':
      return [
        ...(metadata.event_date ? [metadata.event_date] : []),
        ...(metadata.remaining != null ? [`${metadata.remaining} places restantes`] : []),
      ]
    case 'digital':
      return [
        ...(metadata.file_url ? ['Fichier lié'] : []),
        ...(metadata.download_limit ? [`${metadata.download_limit} téléch. max`] : []),
      ]
    default:
      return []
  }
}

export function productToCardView(p: Product): ProductCardView {
  return {
    kind: p.kind,
    name: p.name,
    description: p.description,
    price: p.price,
    currency: p.currency,
    imageUrl: p.image_url,
    stockQuantity: p.stock_quantity,
    isActive: p.is_active,
    optionBadges: deriveOptionBadges({
      kind: p.kind,
      sizes: p.kind === 'physical' ? p.sizes : [],
      colors: p.kind === 'physical' ? p.colors : [],
      metadata: p.metadata,
    }),
  }
}

/** Reuses the real `buildMetadata` (not a copy) so the preview's badges can never diverge from
 * what will actually be saved. */
export function formToCardView(f: ProductFormState, product?: Product): ProductCardView {
  const price = Number.parseFloat(f.price)
  return {
    kind: f.kind,
    name: f.name.trim(),
    description: f.description.trim() || null,
    price: Number.isFinite(price) ? price : null,
    currency: f.currency || 'DZD',
    imageUrl: f.image_url.trim() || null,
    stockQuantity: Number.parseInt(f.stock_quantity, 10) || 0,
    isActive: product?.is_active ?? true,
    optionBadges: deriveOptionBadges({
      kind: f.kind,
      sizes: f.kind === 'physical' ? f.sizes : [],
      colors: f.kind === 'physical' ? f.colors : [],
      metadata: buildMetadata(f, product),
    }),
  }
}
