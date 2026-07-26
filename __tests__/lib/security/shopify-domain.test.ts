import { describe, it, expect } from 'vitest'
import { isValidShopifyDomain } from '@/lib/security/shopify-domain'

describe('isValidShopifyDomain', () => {
  it('accepts a plain myshopify.com domain', () => {
    expect(isValidShopifyDomain('my-shop.myshopify.com')).toBe(true)
  })

  it('rejects an arbitrary external host', () => {
    expect(isValidShopifyDomain('evil.com')).toBe(false)
  })

  it('rejects the cloud metadata address', () => {
    expect(isValidShopifyDomain('169.254.169.254')).toBe(false)
  })

  it('rejects a lookalike domain with myshopify.com as a subdomain', () => {
    expect(isValidShopifyDomain('shop.myshopify.com.evil.com')).toBe(false)
  })

  it('rejects a domain with a path or scheme still attached', () => {
    expect(isValidShopifyDomain('https://shop.myshopify.com/admin')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidShopifyDomain('')).toBe(false)
  })
})
