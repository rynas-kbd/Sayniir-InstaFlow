import type { Product } from './state.ts'

/** Keyword-scored in-memory product search — avoids dumping the full catalog into every LLM
 *  prompt once a shop has more than a handful of products. Products are already fetched once
 *  per inbound message by the caller, so this filters that array rather than hitting the DB again. */

const DEFAULT_LIMIT = 8

export function selectRelevantProducts(
  products: Product[],
  messageText: string,
  opts?: { limit?: number; mustInclude?: string | null }
): { products: Product[]; wasFiltered: boolean } {
  const limit = opts?.limit ?? DEFAULT_LIMIT
  if (products.length <= limit) return { products, wasFiltered: false }

  const tokens = messageText
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3)

  const scored = products.map((p) => {
    const haystack = `${p.name} ${p.description ?? ''}`.toLowerCase()
    const score = tokens.reduce((acc, token) => acc + (haystack.includes(token) ? 1 : 0), 0)
    return { product: p, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, limit).map((s) => s.product)

  if (opts?.mustInclude && !top.some((p) => p.id === opts.mustInclude)) {
    const selected = products.find((p) => p.id === opts.mustInclude)
    if (selected) {
      top.pop()
      top.push(selected)
    }
  }

  return { products: top, wasFiltered: true }
}

/** Trims a product row down to the fields worth spending tokens on in an LLM prompt. */
export function toPromptCatalogEntry(p: Product) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    kind: p.kind ?? 'physical',
    ...(p.sizes?.length ? { sizes: p.sizes } : {}),
    ...(p.colors?.length ? { colors: p.colors } : {}),
  }
}
