import { describe, test, expect } from 'vitest'
import { parseSlot, resolveProduct } from '../../../../lib/agent/ecommerce/parse'
import type { Product } from '../../../../lib/agent/ecommerce/state'

const sasuke: Product = {
  id: 'p1',
  name: 'T-shirt Sasuke',
  price: 2500,
  kind: 'physical',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Noir', 'Blanc', 'Rouge'],
}
const itachi: Product = {
  id: 'p2',
  name: 'T-shirt Itachi',
  price: 2600,
  kind: 'physical',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Noir', 'Blanc'],
}

describe('parseSlot — confirmation (fixes: "non" to an unrelated question cancelling the order)', () => {
  test('matches "oui" as confirmation only when awaited', () => {
    expect(parseSlot('confirmation', 'oui', null)).toEqual({ matched: true, isConfirmation: true, isCancellation: false })
  })

  test('matches "non" as cancellation only when awaited', () => {
    expect(parseSlot('confirmation', 'non', null)).toEqual({ matched: true, isConfirmation: false, isCancellation: true })
  })

  test('a delivery-mode answer is never resolved by the confirmation slot', () => {
    // Regression for the bug where "non" answering "domicile ou point de
    // retrait ?" cancelled the whole order — this must be parsed under the
    // 'mode de livraison' slot, never under 'confirmation'.
    const result = parseSlot('mode de livraison', 'non', null)
    expect(result.matched).toBe(false)
  })
})

describe('parseSlot — taille / couleur', () => {
  test('matches an exact size against the current product', () => {
    expect(parseSlot('taille', 'M', sasuke)).toEqual({ matched: true, value: 'M' })
  })

  test('matches case/accent-insensitively', () => {
    expect(parseSlot('couleur', 'noir', sasuke)).toEqual({ matched: true, value: 'Noir' })
  })

  test('does not match a size the product does not have', () => {
    expect(parseSlot('taille', 'XXL', sasuke).matched).toBe(false)
  })
})

describe('parseSlot — téléphone', () => {
  test('matches a valid Algerian mobile number', () => {
    expect(parseSlot('téléphone', '0794055836', null)).toEqual({ matched: true, value: '0794055836' })
  })

  test('rejects an invalid phone number instead of accepting it as-is', () => {
    expect(parseSlot('téléphone', 'askjdh', null).matched).toBe(false)
  })
})

describe('parseSlot — wilaya', () => {
  test('resolves a known wilaya', () => {
    expect(parseSlot('wilaya', 'bejaia', null)).toEqual({ matched: true, value: 'Béjaïa' })
  })

  test('rejects free text that matches no wilaya', () => {
    expect(parseSlot('wilaya', 'quelque part', null).matched).toBe(false)
  })
})

describe('parseSlot — adresse complète (fixes: arbitrary text stored as address)', () => {
  test('accepts free text when awaited', () => {
    expect(parseSlot('adresse complète', 'Akbou, Ighram', null)).toEqual({ matched: true, value: 'Akbou, Ighram' })
  })

  test('rejects a delivery-mode answer even when it is ≥10 characters', () => {
    // Regression for the exact bug in the audit: "Je veux la livraison a
    // domicile" (>10 chars) was stored verbatim as the shipping address.
    const result = parseSlot('adresse complète', 'Je veux la livraison a domicile', null)
    expect(result.matched).toBe(false)
  })

  test('rejects a confirmation word', () => {
    expect(parseSlot('adresse complète', 'oui', null).matched).toBe(false)
  })

  test('rejects a question without a trailing "?" (audit finding F7)', () => {
    // "c'est combien la livraison" has no question mark at all — the old
    // check (only a trailing "?"/"؟") let this slide through and get
    // stored verbatim as the address.
    expect(parseSlot('adresse complète', "c'est combien la livraison", null).matched).toBe(false)
  })

  test('rejects text shorter than a plausible address', () => {
    expect(parseSlot('adresse complète', 'Alger', null).matched).toBe(false)
  })
})

describe('parseSlot — nom complet', () => {
  test('accepts a name', () => {
    expect(parseSlot('nom complet', 'Rynas Kebdi', null)).toEqual({ matched: true, value: 'Rynas Kebdi' })
  })

  test('rejects a question', () => {
    expect(parseSlot('nom complet', 'vous livrez le vendredi ?', null).matched).toBe(false)
  })

  test('rejects a question without a trailing "?" (audit finding F7)', () => {
    // Regression for the actual bug: any text not ending in "?" was
    // accepted outright, so "c'est combien la livraison" (no "?") got
    // stored as the customer's name.
    expect(parseSlot('nom complet', "c'est combien la livraison", null).matched).toBe(false)
  })

  test('rejects a greeting sent mid-flow instead of storing it as the name (audit finding F6/F7)', () => {
    expect(parseSlot('nom complet', 'salam', null).matched).toBe(false)
  })

  test('rejects text containing digits', () => {
    expect(parseSlot('nom complet', 'Rynas 2', null).matched).toBe(false)
  })

  test('rejects a long sentence (more than 5 words)', () => {
    expect(parseSlot('nom complet', 'je ne sais pas trop comment vous dire', null).matched).toBe(false)
  })

  test('rejects a single character', () => {
    expect(parseSlot('nom complet', 'R', null).matched).toBe(false)
  })
})

describe('resolveProduct', () => {
  const catalog = [sasuke, itachi]

  test('resolves an exact name match', () => {
    expect(resolveProduct('T-shirt Sasuke', catalog)).toEqual(sasuke)
  })

  test('resolves case/accent-insensitively', () => {
    expect(resolveProduct('t-shirt sasuke', catalog)).toEqual(sasuke)
  })

  test('returns null when no product matches', () => {
    expect(resolveProduct('casquette', catalog)).toBeNull()
  })
})
