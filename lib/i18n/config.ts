/**
 * Locale configuration — single source of truth for supported languages.
 *
 * Preferences follow the same pattern as `components/custom-theme-provider.tsx`:
 * cookie (fast, works pre-auth) + Supabase `user_metadata` (cross-device),
 * never localStorage. See that file for the persistence precedent.
 */

export const LOCALES = ['fr', 'en', 'ar'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'

export const RTL_LOCALES: readonly Locale[] = ['ar']

export const LOCALE_COOKIE = 'Raddlly_locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

export function getDir(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'
}

/**
 * Parse an `Accept-Language` header and return the best-matching supported
 * locale, falling back to `DEFAULT_LOCALE`. Used by `proxy.ts` on first
 * visit, before any `Raddlly_locale` cookie exists.
 */
export function matchLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE

  const ranges = header
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';q=')
      const quality = qPart ? Number.parseFloat(qPart) : 1
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 1 : quality }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranges) {
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }

  return DEFAULT_LOCALE
}
