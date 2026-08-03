import { describe, test, expect } from 'vitest'
import { resolveWilaya } from '../../../../lib/agent/ecommerce/wilayas'

describe('resolveWilaya', () => {
  test('resolves the canonical French spelling', () => {
    expect(resolveWilaya('Béjaïa')).toBe('Béjaïa')
  })

  test('resolves an unaccented, lowercased spelling', () => {
    expect(resolveWilaya('bejaia')).toBe('Béjaïa')
  })

  test('resolves an alternate spelling from the alt list', () => {
    expect(resolveWilaya('bougie')).toBe('Béjaïa')
  })

  test('resolves the Arabic name', () => {
    expect(resolveWilaya('بجاية')).toBe('Béjaïa')
  })

  test('resolves when embedded in a longer sentence (substring pass)', () => {
    expect(resolveWilaya('je suis a bejaia akbou')).toBe('Béjaïa')
  })

  test('resolves Algiers under its common English/alt spelling', () => {
    expect(resolveWilaya('algiers')).toBe('Alger')
  })

  test('resolves a hyphenated multi-word wilaya', () => {
    expect(resolveWilaya('Tizi-Ouzou')).toBe('Tizi Ouzou')
  })

  test('returns null for empty input', () => {
    expect(resolveWilaya('')).toBeNull()
    expect(resolveWilaya('   ')).toBeNull()
  })

  test('returns null for garbage input that matches no wilaya', () => {
    expect(resolveWilaya('xyzabc123')).toBeNull()
  })

  test('does not false-positive match a short unrelated word', () => {
    expect(resolveWilaya('oui')).toBeNull()
  })
})
