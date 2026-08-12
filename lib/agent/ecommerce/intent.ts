/**
 * Deterministic per-turn intent classification for the order-taking tunnel,
 * evaluated BEFORE parseSlot / the LLM extraction call (see handler.ts).
 *
 * Before this, the tunnel understood exactly one alternative to "answer the
 * currently-awaited field": a bare yes/no at the final confirmation-recap
 * step. Nothing recognized "annuler ma commande", "je veux changer de
 * produit", or "je veux parler à quelqu'un" from anywhere else in the flow,
 * and a greeting ("salam") sent mid-checkout was intercepted upstream and
 * cancelled the whole session outright — the only "exit" the tunnel had
 * (audit finding F6).
 */

export type TurnIntent = 'answer' | 'question' | 'cancel' | 'restart' | 'change_product' | 'human'

/**
 * `\b` in a JS regex is defined purely via `\w` (ASCII letters/digits/
 * underscore) — it never matches anywhere around Arabic-script text, so
 * `/\bشحال\b/` can never match "شحال" at all (confirmed by a regression
 * test on this module: the original greeting regex this codebase already
 * shipped had this exact bug and silently never recognized an
 * Arabic-script greeting). `\p{L}`/`\p{N}` lookaround is the Unicode-aware
 * equivalent, correct for Latin and Arabic script alike.
 */
export function wordBoundaryRegex(alternation: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternation})(?![\\p{L}\\p{N}])`, 'iu')
}

const GREETING_RE = /^(?:bonjour|salut|salam|hello|hi|hey|bonsoir|wesh|coucou|ola|yo|مرحبا|السلام عليكم|وعليكم السلام|كيداير|كيف)(?![\p{L}\p{N}])/iu

const HUMAN_HANDOFF_RE = wordBoundaryRegex(
  'un\\s+humain|une\\s+vraie\\s+personne|vrai\\s+conseiller|parler\\s+(?:a|à)\\s+(?:un\\s+)?(?:humain|responsable|agent|conseiller)|responsable\\s+svp|talk\\s+to\\s+(?:a\\s+)?(?:human|agent|person)|real\\s+person|human\\s+agent|speak\\s+to\\s+(?:a\\s+)?(?:human|agent)|إنسان|شخص\\s+حقيقي|مسؤول|موظف\\s+حقيقي'
)

const CHANGE_PRODUCT_RE = wordBoundaryRegex(
  'autre\\s+produit|un\\s+autre\\s+article|changer\\s+de\\s+produit|produit\\s+diff[ée]rent|change\\s+(?:the\\s+)?product|different\\s+product|another\\s+product|منتج\\s+آخر|حاجة\\s+أخرى|نبدل\\s+المنتج'
)

const RESTART_RE = wordBoundaryRegex(
  'recommencer|nouvelle\\s+commande|repartir\\s+[àa]\\s+z[ée]ro|reprendre\\s+[àa]\\s+z[ée]ro|start\\s+over|restart|from\\s+scratch|من\\s+البداية|نبدا\\s+من\\s+جديد'
)

/**
 * Explicit "cancel the order" phrasing — deliberately distinct from the
 * bare yes/no (isConfirmationMessage/isCancellationMessage in ./state.ts),
 * which only means something at the confirmation-recap step. A bare "non"
 * anywhere else is too ambiguous to read as "cancel my order" — that
 * ambiguity is exactly what let "non" answering a delivery-mode question
 * cancel an in-progress order before ./state.ts scoped it. This requires an
 * actual cancel verb, so it's safe to recognize from any point in the flow.
 */
const EXPLICIT_CANCEL_RE = wordBoundaryRegex(
  'annuler?(?:\\s*(?:ma\\s+)?(?:commande)?)?|laisser?\\s+tomber|stop\\s+(?:la\\s+)?commande|je\\s+ne\\s+veux\\s+plus(?:\\s+commander)?|cancel\\s+(?:my\\s+)?order|إلغاء(?:\\s+الطلب)?|لا\\s+أريد\\s+(?:المتابعة|الطلب)'
)

const QUESTION_MARKERS_RE = wordBoundaryRegex(
  "combien|pourquoi|comment|quand|où|est[- ]ce\\s+que|c'est\\s+quoi|quel|quelle|quels|quelles|شحال|واش|كيفاش|ليه|وقتاش|فين|علاش|why|how|when|where|what|which|do\\s+you|can\\s+you|is\\s+it|are\\s+you|will\\s+you"
)

export function isGreeting(text: string): boolean {
  return GREETING_RE.test(text.trim())
}

/**
 * Anything that reads as a question rather than a slot answer: a greeting,
 * a trailing '?'/'؟', or a common interrogative marker across fr/ar/darija/en.
 * Used by parse.ts to keep a genuine question ("c'est combien la
 * livraison ?") from being deterministically accepted as the answer to a
 * free-text slot like "nom complet" (audit finding F7).
 */
export function looksLikeQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (isGreeting(trimmed)) return true
  if (trimmed.endsWith('?') || trimmed.endsWith('؟')) return true
  return QUESTION_MARKERS_RE.test(trimmed)
}

export function classifyIntent(text: string, awaitingField: string | null): TurnIntent {
  const trimmed = text.trim()
  if (!trimmed) return 'answer'

  if (EXPLICIT_CANCEL_RE.test(trimmed)) return 'cancel'
  if (HUMAN_HANDOFF_RE.test(trimmed)) return 'human'
  if (RESTART_RE.test(trimmed)) return 'restart'
  // Meaningless when there's nothing selected yet to change away from —
  // let a fresh 'produit' answer (which might legitimately contain the
  // word "autre", e.g. a product literally named that) go through the
  // normal product-resolution path instead.
  if (awaitingField !== 'produit' && CHANGE_PRODUCT_RE.test(trimmed)) return 'change_product'
  if (looksLikeQuestion(trimmed)) return 'question'

  return 'answer'
}
