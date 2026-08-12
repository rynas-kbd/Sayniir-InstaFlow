import { describe, test, expect } from 'vitest'
import { detectShopIntent } from '../../../../lib/agent/ecommerce/intent-router'

/**
 * Covers the spec's own test matrix (système de détection des intentions,
 * requirement §11) plus the shared-post edge cases from §2.
 */

describe('detectShopIntent — purchase intent', () => {
  test('"Je veux acheter ce produit" → purchase', () => {
    expect(detectShopIntent('Je veux acheter ce produit', { hasSharedPost: false })).toMatchObject({ primary: 'purchase', chainPurchase: false })
  })

  test('"Je prends celui-ci" → purchase', () => {
    expect(detectShopIntent('Je prends celui-ci', { hasSharedPost: false })).toMatchObject({ primary: 'purchase' })
  })
})

describe('detectShopIntent — availability intent', () => {
  test('"Il est disponible ?" → availability, no chaining', () => {
    expect(detectShopIntent('Il est disponible ?', { hasSharedPost: false })).toMatchObject({ primary: 'availability', chainPurchase: false })
  })

  test('"Vous avez encore ce produit ?" → availability', () => {
    expect(detectShopIntent('Vous avez encore ce produit ?', { hasSharedPost: false })).toMatchObject({ primary: 'availability' })
  })

  test('"Il est dispo ? Si oui je le prends" → availability, chained to purchase', () => {
    expect(detectShopIntent('Il est dispo ? Si oui je le prends', { hasSharedPost: false })).toMatchObject({
      primary: 'availability',
      chainPurchase: true,
    })
  })

  test('darija/Arabic "واش باقي" reads as availability', () => {
    expect(detectShopIntent('واش باقي هاد المنتج', { hasSharedPost: false }).primary).toBe('availability')
  })
})

describe('detectShopIntent — catalogue questions', () => {
  test('"Combien coûte ce produit ?" → question', () => {
    expect(detectShopIntent('Combien coûte ce produit ?', { hasSharedPost: false })).toMatchObject({ primary: 'question' })
  })

  test('"Il existe en bleu ?" → question', () => {
    expect(detectShopIntent('Il existe en bleu ?', { hasSharedPost: false })).toMatchObject({ primary: 'question' })
  })
})

describe('detectShopIntent — shared post', () => {
  test('"Vous avez ça ?" + post → availability', () => {
    expect(detectShopIntent('Vous avez ça ?', { hasSharedPost: true })).toMatchObject({ primary: 'availability' })
  })

  test('"dispo ?" + post → availability', () => {
    expect(detectShopIntent('dispo ?', { hasSharedPost: true })).toMatchObject({ primary: 'availability' })
  })

  test('"Je veux celui-ci" + post → availability with a chained purchase', () => {
    expect(detectShopIntent('Je veux celui-ci', { hasSharedPost: true })).toMatchObject({ primary: 'availability', chainPurchase: true })
  })

  test('a bare shared post with no text at all → availability', () => {
    expect(detectShopIntent('', { hasSharedPost: true })).toMatchObject({ primary: 'availability', chainPurchase: false })
  })

  test('a short, unrelated reply with a shared post still reads as a product reference', () => {
    // "ok" alone carries no signal, but paired with a shared post it's read
    // as "is THIS (the shared post) available?" per requirement §2.
    expect(detectShopIntent('ok', { hasSharedPost: true }).primary).toBe('availability')
  })

  test('a long, clearly unrelated message with a shared post is NOT forced into availability', () => {
    const long = 'Je voulais juste vous dire que votre boutique est vraiment magnifique et bien organisée'
    expect(detectShopIntent(long, { hasSharedPost: true }).primary).not.toBe('availability')
  })
})

describe('detectShopIntent — no signal', () => {
  test('an unrelated message with no post is unknown', () => {
    expect(detectShopIntent('Merci beaucoup', { hasSharedPost: false })).toMatchObject({ primary: 'unknown', chainPurchase: false })
  })

  test('empty text with no shared post is unknown', () => {
    expect(detectShopIntent('   ', { hasSharedPost: false })).toMatchObject({ primary: 'unknown' })
  })
})
