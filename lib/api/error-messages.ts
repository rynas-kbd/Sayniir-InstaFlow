import type { Translator } from '@/lib/i18n/translate'

/**
 * Resolves a stable error CODE — as returned in the `error` field of
 * lib/api/errors.ts's jsonError/unauthorized/forbidden/badRequest/notFound
 * responses — into a localized, user-facing message via the `errors`
 * dictionary namespace (lib/i18n/dictionaries/*\/errors.ts).
 *
 * Falls back to a generic server-error message for codes with no dictionary
 * entry (e.g. a call site not yet migrated off an inline message, or a
 * genuinely unexpected code) so a raw code or a missing-key placeholder
 * never leaks to the UI.
 */
export function translateErrorCode(t: Translator, code: string | undefined | null): string {
  if (!code) return t('errors.SERVER_ERROR')
  const path = `errors.${code}`
  const translated = t(path)
  // createTranslator() resolves an unknown key to the path itself — that's
  // our signal the code has no dictionary entry yet.
  if (translated === path) return t('errors.SERVER_ERROR')
  return translated
}
