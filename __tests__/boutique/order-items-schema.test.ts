import { describe, expect, test } from 'vitest'
import { buildOrderItemsPayload, hasOrderItemsErrors, validateOrderItems, type EditableOrderItem } from '@/components/boutique/order-items-schema'
import type { Translator } from '@/lib/i18n/translate'

const t = Object.assign((key: string) => key, {
  plural: (key: string) => key,
  list: () => [],
}) as Translator
const valid: EditableOrderItem = {
  product_id: 'p1',
  variant_id: null,
  product_name: 'T-shirt',
  size: null,
  color: null,
  quantity: 1,
  unit_price: 1000,
  currency: 'DZD',
  position: 0,
}

describe('order items schema', () => {
  test('requires at least one line', () => {
    expect(validateOrderItems([], t).root).toBe('boutique.orderTable.validation.noItems')
  })

  test('validates quantity, price, and product name', () => {
    const errors = validateOrderItems([{ ...valid, product_name: '', quantity: 0, unit_price: -1 }], t)
    expect(hasOrderItemsErrors(errors)).toBe(true)
    expect(errors.lines?.[0]).toMatchObject({
      product_name: 'boutique.orderTable.validation.productRequired',
      quantity: 'boutique.orderTable.validation.quantityInvalid',
      unit_price: 'boutique.orderTable.validation.priceInvalid',
    })
  })

  test('builds a normalized payload with stable positions', () => {
    expect(buildOrderItemsPayload([{ ...valid, position: 9, product_name: ' T-shirt ' }])).toEqual([
      { ...valid, position: 0, product_name: 'T-shirt' },
    ])
  })
})
