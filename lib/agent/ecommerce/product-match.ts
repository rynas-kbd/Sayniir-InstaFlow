import type { Product } from './state.ts'
import { foldedEquals, tokenize, levenshteinCapped } from './normalize.ts'

/**
 * Robust product identification against a customer message (or a resolved
 * post caption) — casing, accents, typos, partial names, category words.
 *
 * This is deliberately separate from resolveProduct() in ./parse.ts, which
 * stays exact-then-unique-substring and is what the order-taking tunnel
 * uses to resolve its 'produit' slot (a place where over-eager fuzzy
 * matching would silently put the wrong item in someone's cart). This
 * module is for the availability check (requirement §4: casing, typos,
 * partial names, "informations provenant d'un post"), where getting the
 * wrong match is caught by the customer reading the reply back, not by
 * silently completing an order — and where NOT finding a real match should
 * surface as 'ambiguous'/'not found' rather than nothing at all.
 */

export interface ProductMatch {
  product: Product
  score: number
}

export interface ProductMatchResult {
  best: ProductMatch | null
  candidates: ProductMatch[]
  /** True when the top two candidates are too close to call — the caller should ask for clarification, not guess. */
  ambiguous: boolean
}

const MAX_TYPO_DISTANCE = 2
const MIN_TOKEN_LENGTH_FOR_TYPO = 4
/** A second candidate scoring within this fraction of the top one is treated as a genuine tie. */
const AMBIGUITY_RATIO = 0.85
const EXACT_TOKEN_WEIGHT = 3
const TYPO_TOKEN_WEIGHT = 1.5
const SECONDARY_FIELD_WEIGHT = 1

function tokenMatches(needle: string, haystackTokens: string[]): number {
  if (haystackTokens.includes(needle)) return EXACT_TOKEN_WEIGHT
  if (needle.length < MIN_TOKEN_LENGTH_FOR_TYPO) return 0
  const closest = haystackTokens.some((t) => t.length >= MIN_TOKEN_LENGTH_FOR_TYPO && levenshteinCapped(needle, t, MAX_TYPO_DISTANCE) <= MAX_TYPO_DISTANCE)
  return closest ? TYPO_TOKEN_WEIGHT : 0
}

function scoreProduct(queryTokens: string[], product: Product, extraCaptions: string[]): number {
  const nameTokens = tokenize(product.name)
  const secondaryTokens = tokenize([product.category ?? '', product.description ?? '', ...extraCaptions].join(' '))

  let score = 0
  for (const token of queryTokens) {
    score += tokenMatches(token, nameTokens) + (tokenMatches(token, secondaryTokens) > 0 ? SECONDARY_FIELD_WEIGHT : 0)
  }
  return score
}

/**
 * @param extraCaptionsByProductId — captions of posts already linked to a
 * product (see product-posts.ts), included in scoring so a message that
 * only matches a linked post's caption still finds the right product.
 */
export function matchProducts(text: string, products: Product[], extraCaptionsByProductId?: Record<string, string[]>): ProductMatchResult {
  const trimmed = text.trim()
  if (!trimmed || products.length === 0) return { best: null, candidates: [], ambiguous: false }

  // An exact (folded) name match is unambiguous by construction — short-circuits
  // the scored path entirely, same guarantee resolveProduct() gives the tunnel.
  const exact = products.find((p) => foldedEquals(p.name, trimmed))
  if (exact) return { best: { product: exact, score: Infinity }, candidates: [{ product: exact, score: Infinity }], ambiguous: false }

  const queryTokens = tokenize(trimmed)
  if (queryTokens.length === 0) return { best: null, candidates: [], ambiguous: false }

  const scored = products
    .map((product) => ({ product, score: scoreProduct(queryTokens, product, extraCaptionsByProductId?.[product.id] ?? []) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { best: null, candidates: [], ambiguous: false }

  const top = scored[0]
  const runnerUp = scored[1]
  const ambiguous = !!runnerUp && runnerUp.score >= top.score * AMBIGUITY_RATIO

  return { best: ambiguous ? null : top, candidates: scored, ambiguous }
}
