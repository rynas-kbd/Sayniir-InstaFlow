import { describe, test, expect } from 'vitest'
import { normalizeTags } from '../../components/shared/tag-input'

describe('normalizeTags', () => {
  test('splits on commas, trims whitespace, drops empties', () => {
    expect(normalizeTags('S, M ,  L,', [])).toEqual(['S', 'M', 'L'])
  })

  test('splits on semicolons and newlines too (paste-friendly)', () => {
    expect(normalizeTags('S;M\nL', [])).toEqual(['S', 'M', 'L'])
  })

  test('dedupes case-insensitively against existing tags', () => {
    expect(normalizeTags('m, XL', ['M', 'S'])).toEqual(['XL'])
  })

  test('dedupes within the same batch', () => {
    expect(normalizeTags('S, s, S', [])).toEqual(['S'])
  })

  test('respects maxTags across existing + new', () => {
    expect(normalizeTags('A, B, C', ['X'], 2)).toEqual(['A'])
  })

  test('empty/whitespace-only input yields no tags', () => {
    expect(normalizeTags('   ', [])).toEqual([])
    expect(normalizeTags('', [])).toEqual([])
  })
})
