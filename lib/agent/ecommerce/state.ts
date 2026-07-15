import type { Template } from './templates'

/** Order-session slot-filling state machine — ported verbatim from the live Deno ecommerce.ts. */

export interface Product {
  id: string
  name: string
  price: number
  sizes?: string[]
  colors?: string[]
}

export interface OrderSessionState {
  product_id?: string | null
  selected_size?: string | null
  selected_color?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  wilaya?: string | null
  delivery_mode?: string | null
  shipping_address?: string | null
  extra_data?: Record<string, string>
}

export function normalizeAlgerianPhone(phone: string | null): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-().]/g, '')
  if (/^0[5-7]\d{8}$/.test(cleaned)) return cleaned
  if (/^\+213[5-7]\d{8}$/.test(cleaned)) return '0' + cleaned.slice(4)
  if (/^213[5-7]\d{8}$/.test(cleaned)) return '0' + cleaned.slice(3)
  return phone
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

export function getMissingFields(session: OrderSessionState, products: Product[], customInfos: string[]): string[] {
  const product = products.find((p) => p.id === session.product_id)
  const missing: string[] = []

  if (!session.product_id) missing.push('produit')
  if (product?.sizes?.length && !session.selected_size) missing.push('taille')
  if (product?.colors?.length && !session.selected_color) missing.push('couleur')
  if (!session.customer_name) missing.push('nom complet')
  if (!session.customer_phone) missing.push('téléphone')
  if (!session.wilaya) missing.push('wilaya')
  if (!session.delivery_mode) missing.push('mode de livraison')
  if (session.delivery_mode && !session.shipping_address) missing.push('adresse complète')

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

    default:
      return { text: t.askExtra(missingField) }
  }
}
