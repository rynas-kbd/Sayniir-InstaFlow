import type { Locale } from './config'
import type { PluralForms } from './types'

type Vars = Record<string, string | number>

export interface Translator {
  /** Resolve a dot-path string key, e.g. t('settings.title'). */
  (path: string, vars?: Vars): string
  /** Resolve a dot-path plural entry using CLDR plural rules for the active locale. */
  plural: (path: string, count: number, vars?: Vars) => string
  /** Resolve a dot-path key that holds a string array, e.g. plan feature bullet lists. */
  list: (path: string) => string[]
}

function resolvePath(dict: object, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, dict)
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key]
    return value === undefined ? match : String(value)
  })
}

function isPluralForms(value: unknown): value is PluralForms {
  return !!value && typeof value === 'object' && 'other' in value
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function warnMissingKey(path: string, locale: Locale): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n] Missing key "${path}" for locale "${locale}"`)
  }
}

/**
 * Build a translator bound to one dictionary/locale pair. Missing keys
 * resolve to the path itself (visible-in-UI, easy to grep) rather than
 * throwing — a translation gap should never crash the app.
 */
export function createTranslator(dict: object, locale: Locale): Translator {
  const pluralRules = new Intl.PluralRules(locale)

  const t = ((path: string, vars?: Vars) => {
    const value = resolvePath(dict, path)
    if (typeof value === 'string') return interpolate(value, vars)
    if (isPluralForms(value)) return interpolate(value.other, vars)
    warnMissingKey(path, locale)
    return path
  }) as Translator

  t.plural = (path: string, count: number, vars?: Vars) => {
    const value = resolvePath(dict, path)
    if (!isPluralForms(value)) {
      warnMissingKey(path, locale)
      return path
    }
    const category = pluralRules.select(count)
    const template = value[category] ?? value.other
    return interpolate(template, { count, ...vars })
  }

  t.list = (path: string) => {
    const value = resolvePath(dict, path)
    if (isStringArray(value)) return value
    warnMissingKey(path, locale)
    return []
  }

  return t
}
