import type { Translator } from '@/lib/i18n/translate'
import type { Product, ProductMetadata } from '../types'
import type { ProductFormErrors, ProductFormState } from './types'

/** DOM id for each field — shared between the field components (so `Label htmlFor` / `fieldA11y`
 * line up) and `use-product-form.ts` (so it can focus the first invalid field on submit). */
export const FIELD_IDS: Record<keyof ProductFormState, string> = {
  name: 'p-name',
  description: 'p-desc',
  price: 'p-price',
  currency: 'p-currency',
  kind: 'p-kind',
  stock_quantity: 'p-stock',
  sizes: 'p-sizes',
  colors: 'p-colors',
  image_url: 'p-image',
  images: 'p-images',
  category: 'p-category',
  duration_minutes: 'p-duration',
  location: 'p-location',
  file_url: 'p-file',
  download_limit: 'p-download-limit',
  billing_period: 'p-billing',
  event_date: 'p-event-date',
  capacity: 'p-capacity',
}

export function emptyForm(product?: Product): ProductFormState {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    currency: product?.currency ?? 'DZD',
    kind: product?.kind ?? 'physical',
    stock_quantity: product?.stock_quantity?.toString() ?? '0',
    sizes: product?.sizes ?? [],
    colors: product?.colors ?? [],
    image_url: product?.image_url ?? '',
    images: product?.images ?? [],
    category: product?.category ?? '',
    duration_minutes: product?.metadata?.duration_minutes?.toString() ?? '',
    location: product?.metadata?.location ?? '',
    file_url: product?.metadata?.file_url ?? '',
    download_limit: product?.metadata?.download_limit?.toString() ?? '',
    billing_period: product?.metadata?.billing_period ?? 'monthly',
    event_date: product?.metadata?.event_date ?? '',
    capacity: product?.metadata?.capacity?.toString() ?? '',
  }
}

/** Kind-specific metadata JSONB bag. `product` is REQUIRED to preserve `metadata.remaining` across
 * edits — losing it would silently reset every event's remaining-seats counter to full capacity. */
export function buildMetadata(f: ProductFormState, product?: Product): ProductMetadata {
  switch (f.kind) {
    case 'service':
      return {
        ...(f.duration_minutes ? { duration_minutes: parseInt(f.duration_minutes, 10) } : {}),
        ...(f.location ? { location: f.location } : {}),
      }
    case 'digital':
      return {
        ...(f.file_url ? { file_url: f.file_url } : {}),
        ...(f.download_limit ? { download_limit: parseInt(f.download_limit, 10) } : {}),
      }
    case 'subscription':
      return { billing_period: f.billing_period }
    case 'event': {
      const capacity = f.capacity ? parseInt(f.capacity, 10) : undefined
      return {
        ...(f.event_date ? { event_date: f.event_date } : {}),
        ...(capacity !== undefined ? { capacity, remaining: product?.metadata?.remaining ?? capacity } : {}),
      }
    }
    default:
      return {}
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isPositiveInt(value: string): boolean {
  return /^\d+$/.test(value) && parseInt(value, 10) >= 1
}

/** Kind-aware: only inspects fields the current `kind` actually renders, so switching kind away
 * from a section with a stale error never blocks submission on an invisible field. */
export function validateProductForm(f: ProductFormState, t: Translator): ProductFormErrors {
  const errors: ProductFormErrors = {}

  const name = f.name.trim()
  if (!name) errors.name = t('boutique.productForm.validation.nameRequired')
  else if (name.length > 120) errors.name = t('boutique.productForm.validation.nameMax', { max: 120 })

  const price = Number.parseFloat(f.price)
  if (f.price.trim() === '' || !Number.isFinite(price) || price < 0) {
    errors.price = t('boutique.productForm.validation.priceInvalid')
  }

  if (!/^[A-Z]{3}$/.test(f.currency)) {
    errors.currency = t('boutique.productForm.validation.currencyInvalid')
  }

  if (f.kind === 'physical' && f.stock_quantity.trim() !== '' && !/^\d+$/.test(f.stock_quantity)) {
    errors.stock_quantity = t('boutique.productForm.validation.stockInvalid')
  }

  if (f.image_url.trim() !== '' && !isHttpUrl(f.image_url.trim())) {
    errors.image_url = t('boutique.productForm.validation.imageUrlInvalid')
  }

  if (f.kind === 'digital') {
    if (f.file_url.trim() !== '' && !isHttpUrl(f.file_url.trim())) {
      errors.file_url = t('boutique.productForm.validation.fileUrlInvalid')
    }
    if (f.download_limit.trim() !== '' && !isPositiveInt(f.download_limit)) {
      errors.download_limit = t('boutique.productForm.validation.downloadLimitInvalid')
    }
  }

  if (f.kind === 'service' && f.duration_minutes.trim() !== '' && !isPositiveInt(f.duration_minutes)) {
    errors.duration_minutes = t('boutique.productForm.validation.durationInvalid')
  }

  if (f.kind === 'event') {
    if (f.capacity.trim() !== '' && !isPositiveInt(f.capacity)) {
      errors.capacity = t('boutique.productForm.validation.capacityInvalid')
    }
    if (f.event_date.trim() !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(f.event_date)) {
      errors.event_date = t('boutique.productForm.validation.eventDateInvalid')
    }
  }

  return errors
}

export function buildProductPayload(
  f: ProductFormState,
  channelAccountId: string,
  product?: Product,
): Partial<Product> & { channel_account_id: string } {
  return {
    channel_account_id: channelAccountId,
    name: f.name.trim(),
    description: f.description.trim() || null,
    price: Number.parseFloat(f.price),
    currency: f.currency,
    kind: f.kind,
    stock_quantity: parseInt(f.stock_quantity, 10) || 0,
    sizes: f.kind === 'physical' ? f.sizes : [],
    colors: f.kind === 'physical' ? f.colors : [],
    image_url: f.image_url.trim() || null,
    images: f.images.filter(Boolean),
    category: f.category.trim() || null,
    metadata: buildMetadata(f, product),
  }
}
