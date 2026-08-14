import { describe, test, expect } from 'vitest'
import { deriveOptionBadges, productToCardView, formToCardView } from '../../components/boutique/product-card-view'
import { emptyForm } from '../../components/boutique/product-form/product-form-schema'
import type { Product } from '../../components/boutique/types'
import { createTranslator } from '../../lib/i18n/translate'
import { fr } from '../../lib/i18n/dictionaries/fr'

const t = createTranslator(fr, 'fr')

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    channel_account_id: 'a1',
    name: 'T-shirt',
    description: null,
    price: 2500,
    currency: 'DZD',
    kind: 'physical',
    metadata: {},
    sizes: [],
    colors: [],
    image_url: null,
    images: [],
    category: null,
    stock_quantity: 0,
    is_active: true,
    ...overrides,
  }
}

describe('deriveOptionBadges', () => {
  test('physical: concatenates sizes then colors, in order', () => {
    const badges = deriveOptionBadges({ kind: 'physical', sizes: ['S', 'M'], colors: ['Noir'], metadata: {} }, t)
    expect(badges).toEqual(['S', 'M', 'Noir'])
  })

  test('service: duration then location, each optional', () => {
    expect(deriveOptionBadges({ kind: 'service', sizes: [], colors: [], metadata: { duration_minutes: 30 } }, t)).toEqual(['30 min'])
    expect(
      deriveOptionBadges({ kind: 'service', sizes: [], colors: [], metadata: { duration_minutes: 30, location: 'En ligne' } }, t),
    ).toEqual(['30 min', 'En ligne'])
  })

  test('subscription: monthly vs yearly label', () => {
    expect(deriveOptionBadges({ kind: 'subscription', sizes: [], colors: [], metadata: { billing_period: 'monthly' } }, t)).toEqual([
      'Facturation mensuelle',
    ])
    expect(deriveOptionBadges({ kind: 'subscription', sizes: [], colors: [], metadata: { billing_period: 'yearly' } }, t)).toEqual([
      'Facturation annuelle',
    ])
  })

  test('event: remaining=0 still surfaces the badge (uses != null, not truthiness) — French CLDR treats 0 as the "one" plural category, hence the singular form', () => {
    const badges = deriveOptionBadges({
      kind: 'event',
      sizes: [],
      colors: [],
      metadata: { event_date: '2026-08-01', capacity: 50, remaining: 0 },
    }, t)
    expect(badges).toEqual(['2026-08-01', '0 place restante'])
  })

  test('event: remaining undefined omits the badge entirely', () => {
    const badges = deriveOptionBadges({ kind: 'event', sizes: [], colors: [], metadata: { event_date: '2026-08-01' } }, t)
    expect(badges).toEqual(['2026-08-01'])
  })

  test('digital: file + download limit', () => {
    const badges = deriveOptionBadges({
      kind: 'digital',
      sizes: [],
      colors: [],
      metadata: { file_url: 'https://x.test/f.pdf', download_limit: 3 },
    }, t)
    expect(badges).toEqual(['Fichier lié', '3 téléch. max'])
  })
})

describe('productToCardView', () => {
  test('maps a saved product 1:1, deriving badges from its own kind/sizes/colors/metadata', () => {
    const view = productToCardView(product({ sizes: ['S'], colors: ['Blanc'] }), t)
    expect(view).toEqual({
      kind: 'physical',
      name: 'T-shirt',
      description: null,
      price: 2500,
      currency: 'DZD',
      imageUrl: null,
      stockQuantity: 0,
      isActive: true,
      optionBadges: ['S', 'Blanc'],
    })
  })
})

describe('formToCardView', () => {
  test('empty form yields placeholders: empty name, null price', () => {
    const view = formToCardView(emptyForm(), t)
    expect(view.name).toBe('')
    expect(view.price).toBeNull()
    expect(view.currency).toBe('DZD')
  })

  test('coerces price string to number and trims name/description/image_url', () => {
    const form = { ...emptyForm(), name: '  Casquette  ', description: '  Bleue  ', price: '1500.5', image_url: '  https://x.test/i.png  ' }
    const view = formToCardView(form, t)
    expect(view.name).toBe('Casquette')
    expect(view.description).toBe('Bleue')
    expect(view.price).toBe(1500.5)
    expect(view.imageUrl).toBe('https://x.test/i.png')
  })

  test('non-physical kind: sizes/colors gated to [] just like the real payload', () => {
    const form = { ...emptyForm(), kind: 'service' as const, sizes: ['S'], colors: ['Noir'], duration_minutes: '45' }
    const view = formToCardView(form, t)
    expect(view.optionBadges).toEqual(['45 min'])
  })

  test('event preview reuses buildMetadata so remaining can never diverge from the saved payload', () => {
    const savedEvent = product({ kind: 'event', metadata: { capacity: 50, remaining: 12 } })
    const form = { ...emptyForm(savedEvent), capacity: '50' }
    const view = formToCardView(form, t, savedEvent)
    expect(view.optionBadges).toContain('12 places restantes')
  })
})
