/**
 * Source de vérité unique pour les plans — tarifs en DZD (dinars entiers,
 * l'unité que Chargily Pay v2 attend, voir lib/integrations/chargily/client.ts).
 * Importé par l'admin, la landing page, et les routes de facturation.
 */

export type PlanKey = 'free' | 'starter' | 'pro' | 'business'
export type BillingPeriod = 'monthly' | 'annual'

export const PLAN_KEYS: PlanKey[] = ['free', 'starter', 'pro', 'business']

/** -20% sur l'abonnement annuel par rapport à 12 mois au tarif mensuel. */
export const ANNUAL_DISCOUNT_RATE = 0.2

export interface PlanConfig {
  key: PlanKey
  label: string
  /** null = tarif négocié par client (plan Business), pas de prix catalogue. */
  priceMonthlyDzd: number | null
  priceAnnualDzd: number | null
  period: string
  periodAnnual: string
  description: string
  features: string[]
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
    label: 'Free',
    priceMonthlyDzd: 0,
    priceAnnualDzd: 0,
    period: 'pour toujours · 1 canal',
    periodAnnual: 'pour toujours · 1 canal',
    description: 'Pour découvrir Instaflow avant de vous lancer.',
    features: ['1 000 contacts', 'Flow builder visuel', 'Réponses IA basiques (100/mois)', 'Capture de leads'],
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
  starter: {
    key: 'starter',
    label: 'Starter',
    priceMonthlyDzd: 4900,
    priceAnnualDzd: annualFromMonthly(4900),
    period: 'DZD/mois',
    periodAnnual: 'DZD/an',
    description: 'Pour démarrer et automatiser votre premier compte.',
    features: [
      '1 compte connecté (Instagram, Messenger ou WhatsApp)',
      'Inbox unifié',
      'Flows illimités',
      'CRM basique (contacts, tags)',
    ],
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    priceMonthlyDzd: 12900,
    priceAnnualDzd: annualFromMonthly(12900),
    period: 'DZD/mois',
    periodAnnual: 'DZD/an',
    description: "Pour les boutiques et créateurs actifs qui veulent l'IA.",
    features: [
      '3 comptes connectés',
      'Agents IA (Q&A, qualification, prise de commande)',
      'Campagnes de diffusion',
      'Analytics avancées',
      'Tout Starter inclus',
    ],
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    borderClass: 'border-orange-300 dark:border-orange-700',
    highlighted: true,
  },
  business: {
    key: 'business',
    label: 'Business',
    priceMonthlyDzd: null,
    priceAnnualDzd: null,
    period: 'Sur devis',
    periodAnnual: 'Sur devis',
    description: 'Pour les agences et comptes multiples.',
    features: [
      'Comptes illimités',
      'Plusieurs utilisateurs',
      'Support prioritaire',
      'Intégrations sur mesure',
      'Tout Pro inclus',
    ],
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    borderClass: 'border-teal-300 dark:border-teal-700',
  },
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
