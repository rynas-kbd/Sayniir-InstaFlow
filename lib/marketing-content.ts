import { MessageCircle, Zap, Users, BarChart3, Megaphone, Bot } from 'lucide-react'
import { PLAN_CONFIG, formatDzd, getPlanDisplayFr, type PlanKey } from '@/lib/plans'

export const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Inbox unifié',
    description:
      'Instagram, Messenger et WhatsApp dans une seule interface. Finis les onglets, une seule inbox pour tout gérer.',
  },
  {
    icon: Zap,
    title: 'Flows visuels',
    description:
      'Glisser-déposer pour construire vos automatisations : déclencheurs, conditions, délais et tags — sans code.',
  },
  {
    icon: Users,
    title: 'CRM intégré',
    description: 'Chaque contact centralisé avec tags, segments et historique complet pour cibler avec précision.',
  },
  {
    icon: Bot,
    title: 'Agents IA',
    description:
      "L'IA répond, qualifie les leads et prend des commandes pendant que vous vous concentrez sur ce qui compte.",
  },
  {
    icon: Megaphone,
    title: 'Campagnes',
    description: 'Diffusez un message à tout un segment en respectant automatiquement la fenêtre de messagerie Meta.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Taux de réponse, nouveaux contacts, performance des flows — mesurez ce qui compte vraiment.',
  },
]

export const SOCIAL_PROOF = [
  { label: 'Messages automatisés', value: '2.4M+' },
  { label: 'Temps de réponse moyen', value: '< 1s' },
  { label: 'Comptes connectés', value: '3 200+' },
  { label: 'Satisfaction client', value: '98%' },
]

export const SCREENSHOTS = [
  { src: '/screenshots/dashboard.png', alt: 'Tableau de bord Instaflow' },
  { src: '/screenshots/flow-builder.png', alt: 'Constructeur de flows Instaflow' },
  { src: '/screenshots/inbox.png', alt: 'Inbox unifié Instaflow' },
]

// Dérivé de lib/plans.ts::PLAN_CONFIG — celui-ci est la seule source de
// vérité tarifaire (utilisée aussi par le checkout et le gating de quotas).
// Ne redéclare jamais un prix ici : deux grilles séparées avaient dérivé
// (Starter/Pro/Business en DZD vs free/pro/premium en $) avant cette page.
const MARKETING_TIER_KEYS: PlanKey[] = ['starter', 'pro', 'business']

export const PRICING_TIERS = MARKETING_TIER_KEYS.map((key) => {
  const cfg = PLAN_CONFIG[key]
  const display = getPlanDisplayFr(key)
  const isQuote = cfg.priceMonthlyDzd === null
  return {
    key,
    name: display.label,
    price: isQuote ? 'Sur devis' : formatDzd(cfg.priceMonthlyDzd!),
    period: isQuote ? '' : cfg.period,
    priceAnnual: isQuote ? 'Sur devis' : formatDzd(cfg.priceAnnualDzd!),
    priceAnnualCrossedOut: isQuote ? undefined : formatDzd(cfg.priceMonthlyDzd! * 12),
    periodAnnual: isQuote ? '' : cfg.periodAnnual,
    description: display.description,
    features: display.features,
    highlighted: cfg.highlighted ?? false,
  }
})

export const FAQ_ITEMS = [
  {
    theme: 'Sécurité',
    question: 'Est-ce autorisé par Instagram et Meta ? Je risque un ban ?',
    answer:
      "Instaflow utilise exclusivement les API officielles de Meta (Instagram Messaging API, Messenger Platform, WhatsApp Business API). Aucun scraping ni automatisation non-officielle : votre compte reste conforme aux règles de la plateforme.",
  },
  {
    theme: 'Fonctionnement',
    question: 'Dois-je savoir coder pour créer des automatisations ?',
    answer:
      'Non. Le constructeur de flows fonctionne en glisser-déposer : déclencheurs, conditions, délais et réponses se configurent visuellement, sans une ligne de code.',
  },
  {
    theme: 'Fonctionnement',
    question: 'Combien de temps pour être opérationnel ?',
    answer:
      'La connexion de votre premier compte prend environ 2 minutes. La plupart des utilisateurs ont leur premier flow actif le jour même.',
  },
  {
    theme: 'Sécurité',
    question: "Qu'est-ce que la fenêtre de messagerie de 24h et comment Instaflow la gère ?",
    answer:
      "Meta limite l'envoi de messages hors conversation à une fenêtre de 24h après le dernier message du contact. Instaflow respecte automatiquement cette règle pour vos flows et campagnes, sans action de votre part.",
  },
  {
    theme: 'Facturation',
    question: 'Puis-je annuler à tout moment ?',
    answer:
      'Oui, sans engagement. Vous pouvez annuler votre abonnement à tout moment depuis votre espace client, sans frais ni préavis.',
  },
  {
    theme: 'Facturation',
    question: 'Quels moyens de paiement sont acceptés ?',
    answer:
      'Le paiement se fait en ligne par carte EDAHABIA ou CIB via Chargily. Le plan Business, à tarif négocié, peut être réglé directement depuis votre espace client une fois votre tarif défini avec notre équipe.',
  },
  {
    theme: 'Support',
    question: "Comment obtenir de l'aide si je suis bloqué ?",
    answer:
      "Le support est disponible par message depuis votre espace client. Les clients Business bénéficient en plus d'un support prioritaire avec un temps de réponse garanti.",
  },
  {
    theme: 'Fonctionnement',
    question: 'Puis-je connecter plusieurs comptes Instagram/WhatsApp ?',
    answer:
      'Oui, selon votre palier : 1 compte en Starter, 3 en Pro, illimité en Business. Chaque compte a ses propres flows, contacts et statistiques.',
  },
]

export const FAQ_THEMES = ['Sécurité', 'Fonctionnement', 'Facturation', 'Support'] as const
