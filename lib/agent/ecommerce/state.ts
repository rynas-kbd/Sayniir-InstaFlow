import type { Template } from './templates.ts'

/** Order-session slot-filling state machine — ported verbatim from the live Deno ecommerce.ts,
 *  generalized in Phase 1 to cover non-physical product kinds. */

export type ProductKind = 'physical' | 'service' | 'digital' | 'subscription' | 'event'

export interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  currency?: string
  kind?: ProductKind
  sizes?: string[]
  colors?: string[]
  image_url?: string | null
  metadata?: { remaining?: number; [key: string]: unknown }
  /** Free-text category (components/boutique/types.ts) — used by product-match.ts as a secondary matching field. */
  category?: string | null
  /** See supabase/migrations/20260826_conversation_quality.sql — FALSE means stock is decorative and the product is always treated as available. */
  track_stock?: boolean
  stock_quantity?: number
}

/** Kind-specific free-text field collected via extra_data, in addition to the shared core fields. */
const KIND_EXTRA_FIELDS: Partial<Record<ProductKind, string>> = {
  service: 'créneau souhaité',
  event: 'nombre de places',
}

export interface OrderSessionState {
  items?: CartLine[]
  product_id?: string | null
  selected_size?: string | null
  selected_color?: string | null
  quantity?: number | null
  add_more?: 'pending' | 'done' | null
  customer_name?: string | null
  customer_phone?: string | null
  wilaya?: string | null
  delivery_mode?: string | null
  shipping_address?: string | null
  extra_data?: Record<string, string>
}

export interface CartLine {
  product_id: string
  product_name: string
  selected_size?: string | null
  selected_color?: string | null
  quantity: number
}

export function normalizeAlgerianPhone(phone: string | null): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-().]/g, '')
  if (/^0[5-7]\d{8}$/.test(cleaned)) return cleaned
  if (/^\+213[5-7]\d{8}$/.test(cleaned)) return '0' + cleaned.slice(4)
  if (/^213[5-7]\d{8}$/.test(cleaned)) return '0' + cleaned.slice(3)
  // No Algerian mobile pattern matched — previously this returned the raw
  // string, which let garbage ("askjdh", a wilaya name typed too early,
  // etc.) fill the phone slot and get treated as valid. Returning null
  // makes the caller re-ask instead.
  return null
}

export function normalizeDeliveryMode(raw: string | null | undefined, messageText: string): string | null {
  const sources = [raw?.toLowerCase() ?? '', messageText.toLowerCase()]
  for (const src of sources) {
    if (!src) continue
    if (/retrait|relais|bureau|stop|استلام|نقطة/.test(src)) return 'point_retrait'
    if (/domicile|maison|chez moi|الدار|المنزل|البيت/.test(src)) return 'domicile'
  }
  return raw && ['domicile', 'point_retrait'].includes(raw) ? raw : null
}

export function isConfirmationMessage(text: string): boolean {
  return /^(oui|ok|ouais|wah|c'?est bon|valider?|confirme?|correct|parfait|nickel|go|yes|نعم|واه|أكيد|تمام|صح)$/i.test(text.trim())
}

export function isCancellationMessage(text: string): boolean {
  return /^(non|annuler?|laisser? tomber|stop|nope|لا|إلغاء|يلغي)$/i.test(text.trim())
}

export function isAddMoreYesMessage(text: string): boolean {
  return /^(oui|ok|ouais|wah|encore|ajouter?|un autre|autre article|yes|add|نعم|واه|زيد|آخر)$/i.test(text.trim())
}

export function isAddMoreNoMessage(text: string): boolean {
  return /^(non|no|nope|terminer?|finaliser?|c'?est tout|ça sera tout|pas d'?autre|لا|خلاص|كمل)$/i.test(text.trim())
}

function lineNeedsVariantSlot(line: OrderSessionState, product: Product | undefined): boolean {
  if ((product?.kind ?? 'physical') !== 'physical') return false
  if (product?.sizes?.length && !line.selected_size) return true
  if (product?.colors?.length && !line.selected_color) return true
  return false
}

export function flushCompletedLine(state: OrderSessionState, products: Product[]): OrderSessionState {
  if (!state.product_id) return state
  const product = products.find((p) => p.id === state.product_id)
  if (!product || lineNeedsVariantSlot(state, product) || !state.quantity || state.quantity < 1) return state

  return {
    ...state,
    items: [
      ...(state.items ?? []),
      {
        product_id: product.id,
        product_name: product.name,
        selected_size: state.selected_size ?? null,
        selected_color: state.selected_color ?? null,
        quantity: state.quantity,
      },
    ],
    product_id: null,
    selected_size: null,
    selected_color: null,
    quantity: null,
    add_more: 'pending',
  }
}

export function getMissingFields(session: OrderSessionState, products: Product[], customInfos: string[]): string[] {
  const product = products.find((p) => p.id === session.product_id)
  const cartProducts = (session.items ?? []).map((item) => products.find((p) => p.id === item.product_id)).filter((p): p is Product => Boolean(p))
  const relevantProducts = product ? [product, ...cartProducts] : cartProducts
  const kind: ProductKind = product?.kind ?? cartProducts[0]?.kind ?? 'physical'
  const missing: string[] = []
  const hasItems = (session.items?.length ?? 0) > 0

  if (!session.product_id && (!hasItems || (hasItems && session.add_more === null))) missing.push('produit')

  if (session.product_id && kind === 'physical') {
    if (product?.sizes?.length && !session.selected_size) missing.push('taille')
    if (product?.colors?.length && !session.selected_color) missing.push('couleur')
  }

  if (session.product_id && (!session.quantity || session.quantity < 1)) missing.push('quantité')
  if (!session.product_id && hasItems && session.add_more === 'pending') missing.push('autre article')

  if (!session.customer_name) missing.push('nom complet')
  if (!session.customer_phone) missing.push('téléphone')

  if (relevantProducts.some((p) => (p.kind ?? 'physical') === 'physical')) {
    if (!session.wilaya) missing.push('wilaya')
    if (!session.delivery_mode) missing.push('mode de livraison')
    if (session.delivery_mode && !session.shipping_address) missing.push('adresse complète')
  }

  const kindExtraFields = Array.from(new Set(relevantProducts.map((p) => KIND_EXTRA_FIELDS[p.kind ?? 'physical']).filter((field): field is string => Boolean(field))))
  for (const kindExtraField of kindExtraFields) {
    if (!session.extra_data?.[kindExtraField]) missing.push(kindExtraField)
  }

  for (const info of customInfos) {
    const key = info.toLowerCase().trim()
    if (!session.extra_data?.[key]) missing.push(key)
  }

  return missing
}

export interface NextQuestion {
  text: string
  quickReplies?: Array<{ title: string; payload: string }>
}

export function getNextQuestion(
  missingField: string,
  session: OrderSessionState,
  products: Product[],
  t: Template,
  isNewSession: boolean
): NextQuestion {
  const product = products.find((p) => p.id === session.product_id)

  switch (missingField) {
    case 'produit': {
      if (isNewSession) {
        const list = products
          .map((p) => {
            const details = [p.price + ' DA', ...(p.sizes?.length ? ['tailles: ' + p.sizes.join('/')] : [])].join(' — ')
            return `• ${p.name} (${details})`
          })
          .join('\n')
        return { text: t.askProduct(list) }
      }
      return { text: t.askProductShort }
    }

    case 'taille': {
      const sizeOptions = product?.sizes?.map((s) => ({ title: s, payload: s })) || []
      return {
        text: t.askSize(product?.sizes?.join(', ') ?? ''),
        quickReplies: sizeOptions.length > 0 ? sizeOptions : undefined,
      }
    }

    case 'couleur': {
      const colorOptions = product?.colors?.map((c) => ({ title: c, payload: c })) || []
      return {
        text: t.askColor(product?.colors?.join(', ') ?? ''),
        quickReplies: colorOptions.length > 0 ? colorOptions : undefined,
      }
    }

    case 'quantité':
      return { text: t.askQuantity(product?.name ?? '') }

    case 'autre article':
      return {
        text: t.askAddMore,
        quickReplies: [
          { title: t.addMoreYes, payload: 'oui' },
          { title: t.addMoreNo, payload: 'non' },
        ],
      }

    case 'nom complet':
      return { text: t.askName }
    case 'téléphone':
      return { text: t.askPhone }
    case 'wilaya':
      return { text: t.askWilaya }
    case 'mode de livraison':
      return {
        text: t.askDelivery,
        quickReplies: [
          { title: t.deliveryHome, payload: 'domicile' },
          { title: t.deliveryRelay, payload: 'point_retrait' },
        ],
      }
    case 'adresse complète':
      return { text: session.delivery_mode === 'point_retrait' ? t.askAddressRelay : t.askAddressHome }

    case 'créneau souhaité':
      return { text: t.askSlot }

    case 'nombre de places':
      return { text: t.askSeats(product?.metadata?.remaining) }

    default:
      return { text: t.askExtra(missingField) }
  }
}
