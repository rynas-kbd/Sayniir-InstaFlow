import { describe, test, expect } from 'vitest'
import {
  normalizeAlgerianPhone,
  normalizeDeliveryMode,
  isConfirmationMessage,
  isCancellationMessage,
  getMissingFields,
  getNextQuestion,
  type OrderSessionState,
  type Product,
} from '../../../../lib/agent/ecommerce/state'
import { getTemplate } from '../../../../lib/agent/ecommerce/templates'

describe('normalizeAlgerianPhone', () => {
  test('accepts a local-format mobile number unchanged', () => {
    expect(normalizeAlgerianPhone('0794055836')).toBe('0794055836')
  })

  test('normalizes a +213 international format to local', () => {
    expect(normalizeAlgerianPhone('+213794055836')).toBe('0794055836')
  })

  test('normalizes a 213-prefixed format without the plus', () => {
    expect(normalizeAlgerianPhone('213794055836')).toBe('0794055836')
  })

  test('strips separators before matching', () => {
    expect(normalizeAlgerianPhone('07 94 05 58 36')).toBe('0794055836')
  })

  test('returns null (not the raw string) for anything that is not an Algerian mobile number', () => {
    // Regression: this used to return the input unchanged, so garbage text
    // was silently accepted as a valid phone number and the slot was
    // considered filled.
    expect(normalizeAlgerianPhone('askjdh')).toBeNull()
    expect(normalizeAlgerianPhone('123')).toBeNull()
    expect(normalizeAlgerianPhone('0123456789')).toBeNull() // landline prefix, not mobile
  })

  test('returns null for null input', () => {
    expect(normalizeAlgerianPhone(null)).toBeNull()
  })
})

describe('normalizeDeliveryMode', () => {
  test('detects domicile from keywords', () => {
    expect(normalizeDeliveryMode(null, 'Je veux la livraison a domicile')).toBe('domicile')
  })

  test('detects point_retrait from keywords', () => {
    expect(normalizeDeliveryMode(null, 'point de retrait svp')).toBe('point_retrait')
  })

  test('returns null when neither keyword is present', () => {
    expect(normalizeDeliveryMode(null, 'Akbou, Ighram')).toBeNull()
  })
})

describe('isConfirmationMessage / isCancellationMessage', () => {
  test('matches standalone confirm/cancel words', () => {
    expect(isConfirmationMessage('oui')).toBe(true)
    expect(isCancellationMessage('non')).toBe(true)
  })

  test('does not match when the word is part of a longer sentence', () => {
    // These are anchored (^...$) — a longer message answering a different
    // question must not be misread as confirm/cancel.
    expect(isConfirmationMessage('oui c\'est bon mais je veux annuler')).toBe(false)
    expect(isCancellationMessage('Je veux la livraison a domicile')).toBe(false)
  })
})

describe('getMissingFields / getNextQuestion — slot ordering', () => {
  const product: Product = {
    id: 'p1',
    name: 'T-shirt Sasuke',
    price: 2500,
    kind: 'physical',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Noir', 'Blanc', 'Rouge'],
  }
  const t = getTemplate('fr')

  test('asks for product first on an empty session', () => {
    const session: OrderSessionState = {}
    expect(getMissingFields(session, [product], [])[0]).toBe('produit')
  })

  test('asks for size, then color, then quantity, then name, in order', () => {
    const session: OrderSessionState = { product_id: 'p1' }
    expect(getMissingFields(session, [product], [])[0]).toBe('taille')

    session.selected_size = 'M'
    expect(getMissingFields(session, [product], [])[0]).toBe('couleur')

    session.selected_color = 'Noir'
    expect(getMissingFields(session, [product], [])[0]).toBe('quantité')

    session.quantity = 1
    expect(getMissingFields(session, [product], [])[0]).toBe('nom complet')
  })

  test('only asks for address once a delivery mode is set', () => {
    const session: OrderSessionState = {
      product_id: 'p1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: 'Rynas',
      customer_phone: '0794055836',
      quantity: 1,
      wilaya: 'Béjaïa',
    }
    expect(getMissingFields(session, [product], [])[0]).toBe('mode de livraison')

    session.delivery_mode = 'domicile'
    expect(getMissingFields(session, [product], [])[0]).toBe('adresse complète')
  })

  test('reports no missing fields once everything is filled', () => {
    const session: OrderSessionState = {
      product_id: 'p1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: 'Rynas',
      customer_phone: '0794055836',
      quantity: 1,
      wilaya: 'Béjaïa',
      delivery_mode: 'domicile',
      shipping_address: 'Akbou, Ighram',
    }
    expect(getMissingFields(session, [product], [])).toEqual([])
  })

  test('getNextQuestion returns the size options as quick replies', () => {
    const session: OrderSessionState = { product_id: 'p1' }
    const question = getNextQuestion('taille', session, [product], t, false)
    expect(question.quickReplies?.map((q) => q.title)).toEqual(['S', 'M', 'L', 'XL'])
  })
})
