import type { Translator } from '@/lib/i18n/translate'
import type { OrderItem } from './types'

export interface OrderItemsErrors {
  root?: string
  lines?: Record<number, Partial<Record<'product_name' | 'quantity' | 'unit_price', string>>>
}

export type EditableOrderItem = Pick<OrderItem, 'product_id' | 'variant_id' | 'product_name' | 'size' | 'color' | 'quantity' | 'unit_price' | 'currency' | 'position'>

export function validateOrderItems(lines: readonly EditableOrderItem[], t: Translator): OrderItemsErrors {
  const errors: OrderItemsErrors = {}
  if (lines.length === 0) errors.root = t('boutique.orderTable.validation.noItems')

  lines.forEach((line, index) => {
    const lineErrors: Partial<Record<'product_name' | 'quantity' | 'unit_price', string>> = {}
    if (!line.product_name.trim()) lineErrors.product_name = t('boutique.orderTable.validation.productRequired')
    if (!Number.isInteger(line.quantity) || line.quantity < 1) lineErrors.quantity = t('boutique.orderTable.validation.quantityInvalid')
    if (!Number.isFinite(line.unit_price) || line.unit_price < 0) lineErrors.unit_price = t('boutique.orderTable.validation.priceInvalid')
    if (Object.keys(lineErrors).length > 0) {
      ;(errors.lines ??= {})[index] = lineErrors
    }
  })

  return errors
}

export function hasOrderItemsErrors(errors: OrderItemsErrors): boolean {
  return Boolean(errors.root || (errors.lines && Object.keys(errors.lines).length > 0))
}

export function buildOrderItemsPayload(lines: readonly EditableOrderItem[]): EditableOrderItem[] {
  return lines.map((line, index) => ({
    product_id: line.product_id ?? null,
    variant_id: line.variant_id ?? null,
    product_name: line.product_name.trim(),
    size: line.size ?? null,
    color: line.color ?? null,
    quantity: line.quantity,
    unit_price: line.unit_price,
    currency: line.currency || 'DZD',
    position: index,
  }))
}
