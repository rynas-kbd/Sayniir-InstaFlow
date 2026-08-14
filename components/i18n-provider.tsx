'use client'

import React, { createContext, useContext, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { createClient } from '@/lib/supabase/client'
import { setCookie } from '@/lib/cookies'
import { getDir, isLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config'
import { createTranslator, type Translator } from '@/lib/i18n/translate'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { en } from '@/lib/i18n/dictionaries/en'
import { ar } from '@/lib/i18n/dictionaries/ar'

const DICTIONARIES = { fr, en, ar }

interface I18nContextType {
  locale: Locale
  t: Translator
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function applyToDocument(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = getDir(locale)
}

/**
 * Mounted inside `app/(app)/layout.tsx` and `app/(onboarding)/layout.tsx`
 * only — not the root layout — so marketing/landing pages stay static.
 * `initialLocale` comes from `getLocale()` (server, cookie-based) so there's
 * no first-paint mismatch with the inline script in `app/layout.tsx`.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()
  const reconciledRef = useRef(false)

  // The cookie (read server-side for initialLocale) is the fast path;
  // user_metadata is the cross-device source of truth — same precedence
  // custom-theme-provider.tsx uses for theme prefs. Reconcile once on mount.
  useEffect(() => {
    if (reconciledRef.current) return
    reconciledRef.current = true

    async function reconcile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const metaLocale = user?.user_metadata?.locale
      if (isLocale(metaLocale) && metaLocale !== locale) {
        setLocaleState(metaLocale)
        applyToDocument(metaLocale)
        setCookie(LOCALE_COOKIE, metaLocale)
      }
    }

    reconcile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = (next: Locale) => {
    if (next === locale) return
    setLocaleState(next)
    applyToDocument(next)
    setCookie(LOCALE_COOKIE, next)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const existingMeta = user.user_metadata ?? {}
      void supabase.auth.updateUser({ data: { ...existingMeta, locale: next } })
    })

    router.refresh()
  }

  const t = createTranslator(DICTIONARIES[locale], locale)

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {/* Base UI (the primitive library behind components/ui/*) defaults every
          popover/menu/select to LTR positioning unless told otherwise — it
          doesn't sniff the `dir` attribute on its own. This is what makes
          `align="start"/"end"` on Base UI primitives actually mirror in RTL. */}
      <DirectionProvider direction={getDir(locale)}>{children}</DirectionProvider>
    </I18nContext.Provider>
  )
}

function useI18nContext(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18nContext must be used within an I18nProvider')
  return ctx
}

export function useT(): Translator {
  return useI18nContext().t
}

export function useLocale(): Locale {
  return useI18nContext().locale
}

export function useSetLocale(): (locale: Locale) => void {
  return useI18nContext().setLocale
}
