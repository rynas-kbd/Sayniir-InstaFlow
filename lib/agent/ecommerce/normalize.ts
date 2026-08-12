/**
 * Shared text-normalization helpers for matching customer text against
 * catalog data (product names, categories, wilayas). Extracted from
 * parse.ts, which had these as private helpers before product-match.ts
 * needed the same normalization for fuzzy matching.
 */

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function foldedEquals(a: string, b: string): boolean {
  return stripDiacritics(a).toLowerCase().trim() === stripDiacritics(b).toLowerCase().trim()
}

/** Diacritic-folded, lowercased, non-alphanumeric-collapsed — for tokenizing/comparing loosely. */
export function normalizeLoose(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function tokenize(s: string): string[] {
  return normalizeLoose(s).split(/\s+/).filter(Boolean)
}

/**
 * Levenshtein edit distance, capped at `max` — returns `max + 1` as soon as
 * it's certain the true distance exceeds `max`, so a large `max` never costs
 * more than a small one on clearly-unrelated strings. Used for typo
 * tolerance on product-name tokens (see product-match.ts); not used at all
 * on short tokens where a 1-character typo would change the meaning.
 */
export function levenshteinCapped(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  if (a === b) return 0

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      curr.push(value)
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    prev = curr
  }
  return Math.min(prev[b.length], max + 1)
}
