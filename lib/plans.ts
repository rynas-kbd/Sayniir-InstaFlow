/**
 * Source de vérité unique pour les plans.
 * Importé par l'admin ET la landing page.
 */

export type PlanKey = 'free' | 'pro' | 'premium'

export interface PlanConfig {
  key: PlanKey
  label: string
  priceMonthly: string
  priceAnnual: string
  period: string
  features: string[]
  badgeClass: string   // Tailwind classes for the badge
  borderClass: string  // Border highlight class
  highlighted?: boolean
}

export const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  free: {
    key: 'free',
    label: 'Free',
    priceMonthly: '0 DA',
    priceAnnual: '0 DA',
    period: 'pour toujours · 1 canal',
    features: ['1 000 contacts', 'Flow builder visuel', 'Réponses IA basiques (100/mois)', 'Capture de leads'],
    badgeClass: 'bg-muted text-muted-foreground border-border',
    borderClass: 'border-border',
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    priceMonthly: '29 $',
    priceAnnual: '24 $',
    period: 'par mois · les 3 canaux',
    features: ['10 000 contacts', 'Flows & broadcasts illimités', 'IA complète entraînée sur la marque', 'CRM sync + intégrations', 'Migration gratuite'],
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    borderClass: 'border-orange-300 dark:border-orange-700',
    highlighted: true,
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    priceMonthly: '79 $',
    priceAnnual: '65 $',
    period: 'par mois · équipes & agences',
    features: ['Contacts illimités', 'Inbox partagée, 10 sièges', 'Espaces agence & rapports clients', 'Support prioritaire & onboarding'],
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    borderClass: 'border-teal-300 dark:border-teal-700',
  },
}

export const PLAN_KEYS = Object.keys(PLAN_CONFIG) as PlanKey[]
