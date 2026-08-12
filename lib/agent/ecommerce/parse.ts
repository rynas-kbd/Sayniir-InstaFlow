import { normalizeAlgerianPhone, normalizeDeliveryMode, isConfirmationMessage, isCancellationMessage, type Product } from './state.ts'
import { resolveWilaya } from './wilayas.ts'
import { looksLikeQuestion } from './intent.ts'
import { stripDiacritics, foldedEquals } from './normalize.ts'

/**
 * Deterministic per-slot answer parsing — replaces asking the LLM to
 * extract structured fields from EVERY message, including trivial ones
 * like "M", "Noir", or "oui".
 *
 * Why: the order-taking machine always knows which single field it just
 * asked for (`awaitingField`). A free-text LLM extraction step for that is
 * unnecessary latency (the bottleneck of the whole pipeline), unnecessary
 * cost, and a source of wrong extractions (e.g. a mid-flow question like
 * "vous livrez le vendredi ?" being silently stored as the shipping
 * address because it happened to be ≥10 characters).
 *
 * `parseSlot` only ever looks at the field currently being asked. It does
 * NOT try to opportunistically pull other fields out of the message — that
 * multi-field extraction is exactly what caused the address/confirmation
 * bugs. If the shop wants to support "I want the Sasuke shirt in M size,
 * my name is X" in one message, that's the LLM fallback's job when
 * deterministic parsing returns `matched: false`.
 */

export type SlotField =
  | 'produit'
  | 'taille'
  | 'couleur'
  | 'nom complet'
  | 'téléphone'
  | 'wilaya'
  | 'mode de livraison'
  | 'adresse complète'
  | 'confirmation'
  | string // custom infos_to_collect keys and kind-specific fields (créneau, nombre de places, ...)

export interface SlotParseResult {
  matched: boolean
  /** Present when matched — the normalized value to store for this slot. */
  value?: string
  /** Only set for the 'confirmation' slot. */
  isConfirmation?: boolean
  isCancellation?: boolean
}

/**
 * Attempts to resolve `text` as the answer to `awaitingField`. Returns
 * `matched: false` when the field isn't one handled deterministically, or
 * when the message doesn't look like a valid answer — the caller should
 * fall back to the LLM extractor in that case (e.g. a genuine free-form
 * question, or a slot this module doesn't cover).
 */
export function parseSlot(awaitingField: SlotField, text: string, product: Product | null): SlotParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { matched: false }

  switch (awaitingField) {
    case 'confirmation': {
      if (isConfirmationMessage(trimmed)) return { matched: true, isConfirmation: true, isCancellation: false }
      if (isCancellationMessage(trimmed)) return { matched: true, isConfirmation: false, isCancellation: true }
      return { matched: false }
    }

    case 'taille': {
      const match = product?.sizes?.find((s) => foldedEquals(s, trimmed))
      return match ? { matched: true, value: match } : { matched: false }
    }

    case 'couleur': {
      const match = product?.colors?.find((c) => foldedEquals(c, trimmed))
      return match ? { matched: true, value: match } : { matched: false }
    }

    case 'wilaya': {
      const resolved = resolveWilaya(trimmed)
      return resolved ? { matched: true, value: resolved } : { matched: false }
    }

    case 'mode de livraison': {
      const mode = normalizeDeliveryMode(null, trimmed)
      return mode ? { matched: true, value: mode } : { matched: false }
    }

    case 'téléphone': {
      const phone = normalizeAlgerianPhone(trimmed)
      return phone ? { matched: true, value: phone } : { matched: false }
    }

    case 'nom complet': {
      // A name is free text by nature — accept anything that isn't itself
      // a confirmation/cancellation word or a question. Previously any
      // text not ending in "?" was accepted outright, which let a genuine
      // mid-flow question ("c'est combien la livraison ?" without the
      // question mark, or a greeting) get silently stored as the
      // customer's name (audit finding F7) — looksLikeQuestion catches the
      // interrogative-marker/greeting cases a trailing "?" check misses.
      // A handful of plausibility checks (length, no digits, not a
      // sentence) reject the rest of what a real name never looks like.
      if (isConfirmationMessage(trimmed) || isCancellationMessage(trimmed)) return { matched: false }
      if (looksLikeQuestion(trimmed)) return { matched: false }
      if (trimmed.length < 2 || trimmed.length > 60) return { matched: false }
      if (/\d/.test(trimmed)) return { matched: false }
      if (trimmed.split(/\s+/).length > 5) return { matched: false }
      return { matched: true, value: trimmed }
    }

    case 'adresse complète': {
      // Same free-text caveat as name, plus: never accept something that
      // looks like a delivery-mode answer (client re-answering the
      // previous question), a confirmation/cancellation word, or a
      // question. A real address is rarely under 8 characters.
      if (isConfirmationMessage(trimmed) || isCancellationMessage(trimmed)) return { matched: false }
      if (normalizeDeliveryMode(null, trimmed)) return { matched: false }
      if (looksLikeQuestion(trimmed)) return { matched: false }
      if (trimmed.length < 8) return { matched: false }
      return { matched: true, value: trimmed }
    }

    case 'produit': {
      // Exact/substring match against the catalog is handled by the
      // caller (it needs the full product list, not just the current
      // one) — nothing deterministic to do with a single `product` here.
      return { matched: false }
    }

    default: {
      // Custom infos_to_collect / kind-specific fields (créneau, nombre de
      // places, ...) are free text — accept as-is unless it's a stray
      // confirmation/cancellation word or a question.
      if (isConfirmationMessage(trimmed) || isCancellationMessage(trimmed)) return { matched: false }
      if (looksLikeQuestion(trimmed)) return { matched: false }
      return { matched: true, value: trimmed }
    }
  }
}

/** Deterministic product resolution against the full catalog — exact name match first, then substring. */
export function resolveProduct(text: string, products: Product[]): Product | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const exact = products.find((p) => foldedEquals(p.name, trimmed))
  if (exact) return exact

  const needle = stripDiacritics(trimmed).toLowerCase()
  const substring = products.filter((p) => needle.includes(stripDiacritics(p.name).toLowerCase()) || stripDiacritics(p.name).toLowerCase().includes(needle))
  return substring.length === 1 ? substring[0] : null
}
