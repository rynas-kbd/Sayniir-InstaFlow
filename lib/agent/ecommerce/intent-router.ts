import { wordBoundaryRegex, looksLikeQuestion } from './intent.ts'

/**
 * Turn-entry intent router — decides, BEFORE any LLM call and before the
 * Q&A/order-tunnel agents run, whether an inbound message is primarily an
 * availability check, a purchase intent, a catalogue question, or none of
 * those (see lib/channels/shared/inbound.ts's Scenario B).
 *
 * This is deliberately a different layer from classifyIntent() in
 * ./intent.ts: that one classifies a message AGAINST an in-progress
 * order-tunnel turn (cancel/restart/human/change_product/question/answer,
 * scoped by `awaitingField`). This one runs before any tunnel session
 * exists, to decide which agent gets the message at all. Both are
 * deterministic-first for the same reason parse.ts documents: latency,
 * cost, and — for availability specifically — correctness (an LLM asked
 * "is it available?" without a hard stock check can only guess).
 */

export type ShopIntent = 'availability' | 'purchase' | 'question' | 'unknown'

export interface RoutedIntent {
  primary: ShopIntent
  /**
   * True when the message ALSO carries an explicit purchase commitment
   * ("... si oui je le prends", "Je veux celui-ci"). Only meaningful when
   * primary === 'availability' — see requirement §6 (disponibilité vérifiée
   * d'abord, puis vente UNIQUEMENT si l'achat est explicite dans le même
   * message). The availability handler uses this to decide whether to hand
   * off to the order-taking tunnel once the product is confirmed available.
   */
  chainPurchase: boolean
  /** Which signals fired — for the detailed logging requirement (spec §9), never the raw customer text itself. */
  signals: string[]
}

/** A message this short carries almost no signal on its own — a shared post is what actually identifies the product. */
const SHORT_MESSAGE_MAX_WORDS = 3

const AVAILABILITY_RE = wordBoundaryRegex(
  "dispo|disponible|en\\s+stock|il\\s+en\\s+reste|reste[-\\s]t[-\\s]il|(?:vous\\s+avez|t['\\s]as)\\s+(?:ça|ca|encore|ceci|celui[-\\s]ci)|(?:ça|ca)\\s+existe\\s+encore|est[-\\s]ce\\s+que\\s+je\\s+peux\\s+l'acheter|available|in\\s+stock|still\\s+(?:have|available|got)|do\\s+you\\s+have|متوفر|موجود|كاين|كاينة|مازال|باقي|عندكم|عندك"
)

const PURCHASE_RE = wordBoundaryRegex(
  "je\\s+(?:le\\s+|la\\s+|les\\s+)?prends|je\\s+veux\\s+(?:commander|acheter|celui|celle|ce)|comment\\s+(?:je\\s+peux\\s+)?(?:acheter|commander)|passer\\s+(?:une\\s+)?commande|je\\s+commande|est[-\\s]ce\\s+que\\s+je\\s+peux\\s+l'acheter|i['\\s]ll\\s+take|i\\s+will\\s+take|order|buy|نشري|نطلب|بغيت\\s+نشري|أريد\\s+أن\\s+أطلب|حاب\\s+نشريه"
)

/**
 * @param opts.hasSharedPost — whether this turn carries a post/media the
 * customer shared (see NormalizedInboundMessage.sharedPost). Used to widen
 * what counts as an availability check: a short reply attached to a shared
 * post ("dispo ?", or even no text at all) is a product-availability
 * question about THAT post, not a generic question.
 */
export function detectShopIntent(text: string, opts: { hasSharedPost: boolean }): RoutedIntent {
  const trimmed = text.trim()
  const signals: string[] = []

  if (!trimmed) {
    // A bare post share with no caption text at all is still a real turn
    // (see the inbound.ts guard widened alongside this) — treat it as an
    // implicit "is this available?" rather than dropping it as 'unknown'.
    if (opts.hasSharedPost) return { primary: 'availability', chainPurchase: false, signals: ['bare_shared_post'] }
    return { primary: 'unknown', chainPurchase: false, signals }
  }

  const hasAvailabilitySignal = AVAILABILITY_RE.test(trimmed)
  if (hasAvailabilitySignal) signals.push('availability_keyword')

  const hasPurchaseSignal = PURCHASE_RE.test(trimmed)
  if (hasPurchaseSignal) signals.push('purchase_keyword')

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const isBareReferenceWithPost = opts.hasSharedPost && wordCount <= SHORT_MESSAGE_MAX_WORDS
  if (isBareReferenceWithPost && !hasAvailabilitySignal) signals.push('shared_post_short_message')

  // Priority (requirement §6): availability > purchase > question > unknown.
  // A shared post paired with a short message is read as "is THIS available?"
  // even without an explicit "dispo" keyword — e.g. "Je veux celui-ci" + post.
  if (hasAvailabilitySignal || isBareReferenceWithPost) {
    return { primary: 'availability', chainPurchase: hasPurchaseSignal, signals }
  }

  if (hasPurchaseSignal) {
    return { primary: 'purchase', chainPurchase: false, signals }
  }

  if (looksLikeQuestion(trimmed)) {
    signals.push('question_marker')
    return { primary: 'question', chainPurchase: false, signals }
  }

  return { primary: 'unknown', chainPurchase: false, signals }
}
