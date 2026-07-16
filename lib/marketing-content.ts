import { MessageCircle, Zap, Users, BarChart3, Megaphone, Bot } from 'lucide-react'

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
  { src: '/screenshots/dashboard.png', alt: 'Tableau de bord Sayniir' },
  { src: '/screenshots/flow-builder.png', alt: 'Constructeur de flows Sayniir' },
  { src: '/screenshots/inbox.png', alt: 'Inbox unifié Sayniir' },
]

export const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '4 900',
    period: 'DZD/mois',
    description: 'Pour démarrer et automatiser votre premier compte.',
    features: [
      '1 compte connecté (Instagram, Messenger ou WhatsApp)',
      'Inbox unifié',
      'Flows illimités',
      'CRM basique (contacts, tags)',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '12 900',
    period: 'DZD/mois',
    description: "Pour les boutiques et créateurs actifs qui veulent l'IA.",
    features: [
      '3 comptes connectés',
      'Agents IA (Q&A, qualification, prise de commande)',
      'Campagnes de diffusion',
      'Analytics avancées',
      'Tout Starter inclus',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: 'Sur devis',
    period: '',
    description: 'Pour les agences et comptes multiples.',
    features: [
      'Comptes illimités',
      'Plusieurs utilisateurs',
      'Support prioritaire',
      'Intégrations sur mesure',
      'Tout Pro inclus',
    ],
    highlighted: false,
  },
]

export const FAQ_ITEMS = [
  {
    theme: 'Sécurité',
    question: 'Est-ce autorisé par Instagram et Meta ? Je risque un ban ?',
    answer:
      "Sayniir utilise exclusivement les API officielles de Meta (Instagram Messaging API, Messenger Platform, WhatsApp Business API). Aucun scraping ni automatisation non-officielle : votre compte reste conforme aux règles de la plateforme.",
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
    question: "Qu'est-ce que la fenêtre de messagerie de 24h et comment Sayniir la gère ?",
    answer:
      "Meta limite l'envoi de messages hors conversation à une fenêtre de 24h après le dernier message du contact. Sayniir respecte automatiquement cette règle pour vos flows et campagnes, sans action de votre part.",
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
      'Nous nous adaptons aux moyens de paiement disponibles en Algérie (CCP, Edahabia, virement). Contactez-nous pour organiser le règlement qui vous convient.',
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
