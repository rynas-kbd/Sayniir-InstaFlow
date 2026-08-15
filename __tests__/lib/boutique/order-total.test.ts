import { describe, expect, test } from 'vitest'
import { computeOrderTotals } from '@/lib/boutique/order-total'

describe('computeOrderTotals', () => {
  test('sums multiple lines', () => {
    expect(computeOrderTotals([
      { quantity: 2, unit_price: 1500 },
      { quantity: 1, unit_price: 750 },
    ])).toEqual({ subtotal: 3750, discount: 0, total: 3750 })
  })

  test('applies percentage discounts to the global subtotal', () => {
    expect(computeOrderTotals([
      { quantity: 2, unit_price: 1000 },
      { quantity: 1, unit_price: 500 },
    ], { percent_off: 10 })).toEqual({ subtotal: 2500, discount: 250, total: 2250 })
  })

  test('prefers percent discounts over amount discounts', () => {
    expect(computeOrderTotals([{ quantity: 1, unit_price: 1000 }], { percent_off: 20, amount_off: 900 })).toEqual({
      subtotal: 1000,
      discount: 200,
      total: 800,
    })
  })

  test('bounds fixed discounts to zero total', () => {
    expect(computeOrderTotals([{ quantity: 1, unit_price: 500 }], { amount_off: 900 })).toEqual({
      subtotal: 500,
      discount: 500,
      total: 0,
    })
  })

  test('rounds money values to two decimals', () => {
    expect(computeOrderTotals([{ quantity: 3, unit_price: 10.335 }], { percent_off: 10 })).toEqual({
      subtotal: 31.01,
      discount: 3.1,
      total: 27.91,
    })
  })
})
