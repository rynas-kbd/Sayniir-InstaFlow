import { describe, test, expect } from 'vitest'
import { emptyForm, buildMetadata, validateProductForm, buildProductPayload } from '../../components/boutique/product-form/product-form-schema'
import type { Product } from '../../components/boutique/types'
import type { ProductFormState } from '../../components/boutique/product-form/types'

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
    stock_quantity: 0,
    is_active: true,
    ...overrides,
  }
}

function form(overrides: Partial<ProductFormState> = {}): ProductFormState {
  return { ...emptyForm(), name: 'Test', price: '10', currency: 'DZD', ...overrides }
}

describe('buildMetadata', () => {
  test('event: preserves existing metadata.remaining when capacity is unchanged', () => {
    const saved = product({ kind: 'event', metadata: { capacity: 50, remaining: 12 } })
    const f = form({ kind: 'event', capacity: '50' })
    expect(buildMetadata(f, saved)).toEqual({ capacity: 50, remaining: 12 })
  })

  test('event: falls back remaining to capacity when there is no prior product (create flow)', () => {
    const f = form({ kind: 'event', capacity: '30' })
    expect(buildMetadata(f)).toEqual({ capacity: 30, remaining: 30 })
  })

  test('event: clearing capacity drops both capacity and remaining', () => {
    const saved = product({ kind: 'event', metadata: { capacity: 50, remaining: 12 } })
    const f = form({ kind: 'event', capacity: '' })
    expect(buildMetadata(f, saved)).toEqual({})
  })

  test('service: only includes fields that are filled', () => {
    expect(buildMetadata(form({ kind: 'service', duration_minutes: '30' }))).toEqual({ duration_minutes: 30 })
    expect(buildMetadata(form({ kind: 'service', duration_minutes: '30', location: 'En ligne' }))).toEqual({
      duration_minutes: 30,
      location: 'En ligne',
    })
  })

  test('digital and subscription and default kinds', () => {
    expect(buildMetadata(form({ kind: 'digital', file_url: 'https://x.test/f', download_limit: '3' }))).toEqual({
      file_url: 'https://x.test/f',
      download_limit: 3,
    })
    expect(buildMetadata(form({ kind: 'subscription', billing_period: 'yearly' }))).toEqual({ billing_period: 'yearly' })
    expect(buildMetadata(form({ kind: 'physical' }))).toEqual({})
  })
})

describe('validateProductForm', () => {
  test('empty name and empty/invalid price are flagged', () => {
    const errors = validateProductForm(form({ name: '  ', price: '' }))
    expect(errors.name).toBeTruthy()
    expect(errors.price).toBeTruthy()
  })

  test('is kind-aware: an invalid capacity from a previous event kind stops being validated after switching to physical', () => {
    const f = form({ kind: 'physical', capacity: 'not-a-number' })
    const errors = validateProductForm(f)
    expect(errors.capacity).toBeUndefined()
  })

  test('event kind validates capacity and event_date', () => {
    const errors = validateProductForm(form({ kind: 'event', capacity: '0', event_date: '26/08/2026' }))
    expect(errors.capacity).toBeTruthy()
    expect(errors.event_date).toBeTruthy()
  })

  test('currency must be exactly 3 uppercase letters', () => {
    expect(validateProductForm(form({ currency: 'dzd' })).currency).toBeTruthy()
    expect(validateProductForm(form({ currency: 'DZ' })).currency).toBeTruthy()
    expect(validateProductForm(form({ currency: 'DZD' })).currency).toBeUndefined()
  })

  test('image_url and digital file_url must be http(s) when non-empty, but are optional', () => {
    expect(validateProductForm(form({ image_url: '' })).image_url).toBeUndefined()
    expect(validateProductForm(form({ image_url: 'not-a-url' })).image_url).toBeTruthy()
    expect(validateProductForm(form({ image_url: 'https://x.test/i.png' })).image_url).toBeUndefined()
    expect(validateProductForm(form({ kind: 'digital', file_url: 'ftp://x.test/f' })).file_url).toBeTruthy()
  })

  test('valid minimal physical form has no errors', () => {
    expect(validateProductForm(form())).toEqual({})
  })
})

describe('buildProductPayload', () => {
  test('key set matches the PATCH allowlist in app/api/products/[id]/route.ts (minus is_active)', () => {
    const payload = buildProductPayload(form(), 'acct-1')
    const patchAllowlist = ['name', 'description', 'price', 'currency', 'kind', 'metadata', 'sizes', 'colors', 'image_url', 'stock_quantity']
    for (const key of patchAllowlist) {
      expect(payload).toHaveProperty(key)
    }
  })

  test('non-physical kinds always send empty sizes/colors regardless of stale form state', () => {
    const payload = buildProductPayload(form({ kind: 'service', sizes: ['S'], colors: ['Noir'] }), 'acct-1')
    expect(payload.sizes).toEqual([])
    expect(payload.colors).toEqual([])
  })
})
