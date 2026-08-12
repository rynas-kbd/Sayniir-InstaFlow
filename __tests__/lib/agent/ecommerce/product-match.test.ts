import { describe, test, expect } from 'vitest'
import { matchProducts } from '../../../../lib/agent/ecommerce/product-match'
import type { Product } from '../../../../lib/agent/ecommerce/state'

const shirt: Product = { id: 'p1', name: 'T-shirt Sasuke', price: 2500, category: 'Vêtements' }
const hoodie: Product = { id: 'p2', name: 'Hoodie Naruto', price: 4500, category: 'Vêtements' }
const mug: Product = { id: 'p3', name: 'Mug One Piece', price: 1200, category: 'Accessoires' }
const catalog = [shirt, hoodie, mug]

describe('matchProducts — exact and case/accent-insensitive matching', () => {
  test('exact name match is unambiguous regardless of case', () => {
    const result = matchProducts('t-shirt sasuke', catalog)
    expect(result.best?.product.id).toBe('p1')
    expect(result.ambiguous).toBe(false)
  })

  test('accented / differently-cased input still resolves', () => {
    const result = matchProducts('T-SHIRT SASUKÉ', catalog)
    expect(result.best?.product.id).toBe('p1')
  })
})

describe('matchProducts — typo tolerance', () => {
  test('a small typo in a product name still resolves', () => {
    const result = matchProducts('je veux le t-shirt sasuk', catalog)
    expect(result.best?.product.id).toBe('p1')
  })

  test('a typo two edits away still resolves', () => {
    const result = matchProducts('hoodei naruto', catalog)
    expect(result.best?.product.id).toBe('p2')
  })
})

describe('matchProducts — partial name and category', () => {
  test('a partial product name resolves uniquely', () => {
    const result = matchProducts('vous avez le mug ?', catalog)
    expect(result.best?.product.id).toBe('p3')
  })

  test('a category word alone contributes to scoring but does not out-rank a name hit', () => {
    const result = matchProducts('le hoodie en vêtements', catalog)
    expect(result.best?.product.id).toBe('p2')
  })
})

describe('matchProducts — ambiguity', () => {
  test('two equally-scored candidates are reported as ambiguous rather than picked arbitrarily', () => {
    const twins: Product[] = [
      { id: 'a', name: 'Robe Noire', price: 3000 },
      { id: 'b', name: 'Robe Noire XL', price: 3200 },
    ]
    const result = matchProducts('la robe noire', twins)
    expect(result.ambiguous).toBe(true)
    expect(result.best).toBeNull()
    expect(result.candidates.length).toBeGreaterThanOrEqual(2)
  })
})

describe('matchProducts — no match', () => {
  test('a message with no product signal returns no candidates', () => {
    const result = matchProducts('bonjour, vous livrez à Oran ?', catalog)
    expect(result.best).toBeNull()
    expect(result.candidates).toEqual([])
    expect(result.ambiguous).toBe(false)
  })

  test('empty text returns no candidates', () => {
    const result = matchProducts('   ', catalog)
    expect(result.best).toBeNull()
  })

  test('empty catalog returns no candidates', () => {
    const result = matchProducts('t-shirt sasuke', [])
    expect(result.best).toBeNull()
  })
})
