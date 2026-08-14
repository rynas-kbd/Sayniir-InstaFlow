import type { Translator } from '@/lib/i18n/translate'
import { createTranslator } from '@/lib/i18n/translate'
import { fr } from '@/lib/i18n/dictionaries/fr'

/**
 * Source de vérité unique pour les plans — tarifs en DZD (dinars entiers,
 * l'unité que Chargily Pay v2 attend, voir lib/integrations/chargily/client.ts).
 * Importé par l'admin, la landing page, et les routes de facturation.
 *
 * Label/description/features are translated content, not catalog data — they
 * live in lib/i18n/dictionaries/*\/plans.ts and are resolved via
 * getPlanDisplay()/getPlanDisplayFr() below, not stored on PLAN_CONFIG.
 */

export type PlanKey = 'free' | 'starter' | 'pro' | 'business'
export type BillingPeriod = 'monthly' | 'annual'

export const PLAN_KEYS: PlanKey[] = ['free', 'starter', 'pro', 'business']

/** -20% sur l'abonnement annuel par rapport à 12 mois au tarif mensuel. */
export const ANNUAL_DISCOUNT_RATE = 0.2

export interface PlanConfig {
  key: PlanKey
  /** null = tarif négocié par client (plan Business), pas de prix catalogue. */
  priceMonthlyDzd: number | null
  priceAnnualDzd: number | null
  period: string
  periodAnnual: string
  badgeClass: string   // Tailwind classes for the badge
  borderClass: string  // Border highlight class
  highlighted?: boolean
}

function annualFromMonthly(monthly: number): number {
  return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_RATE))
}

export const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  free: {
    key: 'free',
    priceMonthlyDzd: 0,
    priceAnnualDzd: 0,
    period: 'pour toujours · 1 canal',
    periodAnnual: 'pour toujours · 1 canal',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
  starter: {
    key: 'starter',
    priceMonthlyDzd: 4900,
    priceAnnualDzd: annualFromMonthly(4900),
    period: 'DZD/mois',
    periodAnnual: 'DZD/an',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
  pro: {
    key: 'pro',
    priceMonthlyDzd: 12900,
    priceAnnualDzd: annualFromMonthly(12900),
    period: 'DZD/mois',
    periodAnnual: 'DZD/an',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    borderClass: 'border-orange-300 dark:border-orange-700',
    highlighted: true,
  },
  business: {
    key: 'business',
    priceMonthlyDzd: null,
    priceAnnualDzd: null,
    period: 'Sur devis',
    periodAnnual: 'Sur devis',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    borderClass: 'border-teal-300 dark:border-teal-700',
  },
}

export interface PlanDisplay {
  label: string
  description: string
  features: string[]
}

/**
 * Resolves a plan's translatable copy through the `plans` dictionary
 * namespace (lib/i18n/dictionaries/*\/plans.ts). Call with the caller's
 * bound Translator (useT()/getT()) so label/description/features follow the
 * active locale instead of being hardcoded French.
 */
export function getPlanDisplay(plan: PlanKey, t: Translator): PlanDisplay {
  return {
    label: t(`plans.${plan}.label`),
    description: t(`plans.${plan}.description`),
    features: t.list(`plans.${plan}.features`),
  }
}

// Bound once — French dictionary content is static, so there is no need to
// build a new Translator per call.
const frTranslator = createTranslator(fr, 'fr')

/**
 * French-only convenience for consumers that must not follow the request
 * locale: lib/marketing-content.ts's public PRICING_TIERS (the marketing
 * page stays French regardless of app locale) and the Chargily checkout
 * description (the checkout itself is already hardcoded to `locale: 'fr'`,
 * see app/api/billing/checkout/route.ts).
 */
export function getPlanDisplayFr(plan: PlanKey): PlanDisplay {
  return getPlanDisplay(plan, frTranslator)
}

/** "4 900" — espace insécable fine entre les groupes de milliers. */
export function formatDzd(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/ |\s/g, ' ')
}

export interface SubscriptionPricingRow {
  custom_price_monthly_dzd?: number | null
  custom_price_annual_dzd?: number | null
}

/**
 * Resolves the DZD amount to charge for a given plan/period. Business has no
 * catalog price — it comes from the subscription row's custom columns (set
 * from the admin), and is null until an admin has negotiated one.
 */
export function resolvePlanAmount(
  plan: PlanKey,
  period: BillingPeriod,
  subscription?: SubscriptionPricingRow | null
): number | null {
  if (plan === 'business') {
    return period === 'annual'
      ? (subscription?.custom_price_annual_dzd ?? null)
      : (subscription?.custom_price_monthly_dzd ?? null)
  }
  const cfg = PLAN_CONFIG[plan]
  return period === 'annual' ? cfg.priceAnnualDzd : cfg.priceMonthlyDzd
}
