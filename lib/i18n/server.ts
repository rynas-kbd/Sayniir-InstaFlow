import 'server-only'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config'
import { fr } from './dictionaries/fr'
import { en } from './dictionaries/en'
import { ar } from './dictionaries/ar'
import { createTranslator, type Translator } from './translate'

const DICTIONARIES = { fr, en, ar }

/** Server-side locale read — mirrors lib/supabase/server.ts's cookie access pattern. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
}

export async function getT(): Promise<Translator> {
  const locale = await getLocale()
  return createTranslator(DICTIONARIES[locale], locale)
}
