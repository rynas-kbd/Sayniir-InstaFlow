/**
 * Deterministic, script-based language detection — replaces asking the LLM
 * to guess "fr/ar/darija/en" on every single turn.
 *
 * Why this exists: the previous design froze whatever the LLM detected on
 * the FIRST message into `order_sessions.detected_language` and reused it
 * for every template for the rest of the session, while the LLM's own free
 * prose (`questionReply`) kept following the CURRENT message's language.
 * That produced replies that were half Arabic, half French. Detecting
 * per-turn with a cheap deterministic check removes both the freeze and
 * the LLM round-trip for something a regex handles in microseconds.
 */
export type DetectedLang = 'fr' | 'ar' | 'darija' | 'en'

const ARABIC_SCRIPT_RE = /[؀-ۿ]/

// Darija-specific markers that appear in Arabic-script text but not in
// Modern Standard Arabic (MSA) — used to tell "ar" from "darija" when the
// message is written in Arabic script.
const DARIJA_SCRIPT_MARKERS = /(واش|بزاف|دابا|زعما|راه|ديال|بغيت|خويا|كاين|ماكاش)/

// Darija written in Latin/"Arabizi" script (digits-as-letters, French-Arabic
// mix) — common on Algerian Instagram/Messenger.
const DARIJA_LATIN_RE =
  /\b(wesh|chkoun|bezaf|3lah|3andi|3andek|kayn|kayen|makach|khouya|chhal|ta3|dyal|nchoufou|rani|bghit|wach|3lik|hna|labas)\b/i

const ENGLISH_MARKERS = /\b(hello|hi|thanks|please|yes|no|order|price|size|color|colour)\b/i

/**
 * Detects the language of a single message. Falls back to `fallback`
 * (typically the contact's last known language, or 'fr') when the text is
 * too short/ambiguous to tell — e.g. "M", "oui", "3" — rather than
 * guessing wrong on single-token replies.
 */
export function detectLanguage(text: string, fallback: DetectedLang = 'fr'): DetectedLang {
  const trimmed = text.trim()
  if (!trimmed) return fallback

  if (ARABIC_SCRIPT_RE.test(trimmed)) {
    return DARIJA_SCRIPT_MARKERS.test(trimmed) ? 'darija' : 'ar'
  }

  // Very short latin replies ("M", "L", "oui", "25") carry no language
  // signal of their own — trust the fallback rather than misfire on a
  // one-off English-looking token.
  if (trimmed.replace(/[^\p{L}]/gu, '').length < 3) return fallback

  if (DARIJA_LATIN_RE.test(trimmed)) return 'darija'
  if (ENGLISH_MARKERS.test(trimmed) && !/[àâçéèêëîïôùûüÿœæ]/i.test(trimmed)) return 'en'

  return 'fr'
}
