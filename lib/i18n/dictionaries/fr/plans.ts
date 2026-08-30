/**
 * Translated plan copy — keyed source, values resolved via
 * lib/plans.ts::getPlanDisplay(plan, t). The DZD prices themselves are not
 * translated content (see lib/plans.ts::PLAN_CONFIG, the single pricing
 * source of truth also used by lib/marketing-content.ts's French-only
 * PRICING_TIERS via getPlanDisplayFr()).
 */
export const plans = {
  free: {
    label: 'Free',
    description: 'Pour découvrir Raddlly avant de vous lancer.',
    features: ['1 000 contacts', 'Flow builder visuel', 'Réponses IA basiques (100/mois)', 'Capture de leads'],
  },
  starter: {
    label: 'Starter',
    description: 'Pour démarrer et automatiser votre premier compte.',
    features: [
      '1 compte connecté (Instagram, Messenger ou WhatsApp)',
      'Inbox unifié',
      'Flows illimités',
      'CRM basique (contacts, tags)',
    ],
  },
  pro: {
    label: 'Pro',
    description: "Pour les boutiques et créateurs actifs qui veulent l'IA.",
    features: [
      '3 comptes connectés',
      'Agents IA (Q&A, qualification, prise de commande)',
      'Campagnes de diffusion',
      'Analytics avancées',
      'Tout Starter inclus',
    ],
  },
  business: {
    label: 'Business',
    description: 'Pour les agences et comptes multiples.',
    features: [
      'Comptes illimités',
      'Plusieurs utilisateurs',
      'Support prioritaire',
      'Intégrations sur mesure',
      'Tout Pro inclus',
    ],
  },
}
