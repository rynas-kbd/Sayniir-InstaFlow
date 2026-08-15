import { describe, expect, test } from 'vitest'
import { flushCompletedLine, getMissingFields, type OrderSessionState, type Product } from '@/lib/agent/ecommerce/state'

const physical: Product = {
  id: 'p1',
  name: 'T-shirt Sasuke',
  price: 2500,
  kind: 'physical',
  sizes: ['M'],
  colors: ['Noir'],
}

const service: Product = {
  id: 'p2',
  name: 'Coaching',
  price: 6000,
  kind: 'service',
}

describe('cart session helpers', () => {
  test('flushes a complete current line into items and resets scalar fields', () => {
    const flushed = flushCompletedLine({
      product_id: 'p1',
      selected_size: 'M',
      selected_color: 'Noir',
      quantity: 2,
    }, [physical])

    expect(flushed.items).toEqual([
      { product_id: 'p1', product_name: 'T-shirt Sasuke', selected_size: 'M', selected_color: 'Noir', quantity: 2 },
    ])
    expect(flushed.product_id).toBeNull()
    expect(flushed.selected_size).toBeNull()
    expect(flushed.selected_color).toBeNull()
    expect(flushed.quantity).toBeNull()
    expect(flushed.add_more).toBe('pending')
  })

  test('does not flush before required variants and quantity are present', () => {
    const state: OrderSessionState = { product_id: 'p1', selected_size: 'M', quantity: 1 }
    expect(flushCompletedLine(state, [physical])).toBe(state)
  })

  test('asks line slots before order-level customer fields', () => {
    expect(getMissingFields({ product_id: 'p1' }, [physical], [])[0]).toBe('taille')
    expect(getMissingFields({ product_id: 'p1', selected_size: 'M', selected_color: 'Noir' }, [physical], [])[0]).toBe('quantité')
  })

  test('asks whether to add another item before customer details', () => {
    const missing = getMissingFields({
      items: [{ product_id: 'p1', product_name: 'T-shirt Sasuke', selected_size: 'M', selected_color: 'Noir', quantity: 1 }],
      add_more: 'pending',
    }, [physical], [])

    expect(missing[0]).toBe('autre article')
    expect(missing).toContain('autre article')
  })

  test('mixed physical and service carts collect delivery and service extra fields', () => {
    const missing = getMissingFields({
      items: [
        { product_id: 'p1', product_name: 'T-shirt Sasuke', selected_size: 'M', selected_color: 'Noir', quantity: 1 },
        { product_id: 'p2', product_name: 'Coaching', quantity: 1 },
      ],
      add_more: 'done',
      customer_name: 'Rynas',
      customer_phone: '0794055836',
    }, [physical, service], [])

    expect(missing).toContain('wilaya')
    expect(missing).toContain('créneau souhaité')
  })
})
