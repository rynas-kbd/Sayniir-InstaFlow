/**
 * A pluralized string entry. Locales don't share plural grammar — French
 * only needs `one`/`other`, Arabic (MSA) has all six CLDR categories
 * (zero/one/two/few/many/other). `other` is the only form every locale
 * must provide; the translator falls back to it when a locale-specific
 * form is missing for a given count.
 */
export interface PluralForms {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}
