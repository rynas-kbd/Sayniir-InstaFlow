export const CHANNELS = ['Instagram', 'WhatsApp', 'Messenger'] as const

export interface FlowNode {
  id: string
  label: string
  sub: string
  x: number
  y: number
  tone: 'a' | 's'
  desc: string
}

export const FLOW_NODES: FlowNode[] = [
  { id: 'trigger', label: 'Déclencheur', sub: 'DM avec intention d\'achat', x: 20, y: 60, tone: 'a', desc: 'Se déclenche lorsqu\'un DM Instagram montre une intention d\'achat sans dépendre de mots-clés rigides.' },
  { id: 'ai', label: 'Réponse IA', sub: 'Formée sur vos produits', x: 240, y: 20, tone: 'a', desc: 'Répond avec le ton de votre marque et vos stocks en temps réel. Vous validez le ton une fois pour toutes.' },
  { id: 'qualify', label: 'Qualifier', sub: 'Acheteur chaud ?', x: 240, y: 200, tone: 's', desc: 'Analyse le comportement du prospect. L\'intention élevée passe à la capture email ; le reste va à un humain.' },
  { id: 'capture', label: 'Capturer le lead', sub: 'Email → CRM', x: 460, y: 140, tone: 'a', desc: 'Demande l\'email naturellement et l\'envoie directement vers votre CRM avec l\'historique du dialogue.' },
  { id: 'handoff', label: 'Relais humain', sub: 'Inbox d\'équipe', x: 460, y: 296, tone: 's', desc: 'Transfère la conversation dans votre boîte de réception partagée avec un résumé généré par l\'IA.' },
]

export interface FlowStep {
  node: string
  kind: 'in' | 'out' | 'sys'
  text: string
}

export const FLOW_STEPS: FlowStep[] = [
  { node: 'trigger', kind: 'in', text: 'Salut ! Je cherche des mugs en céramique pour un cadeau, vous avez du stock ?' },
  { node: 'ai', kind: 'out', text: 'Coucou Maya ! 🌿 Oui, le lot de 4 mugs faits main "Terre Brute" est en stock à 44€, livraison offerte cette semaine.' },
  { node: 'qualify', kind: 'in', text: 'Super ! Et il faut compter combien de temps pour la livraison à Lyon ?' },
  { node: 'ai', kind: 'out', text: 'Expédié sous 24h, livré mardi chez vous ! Je vous prépare le panier direct ?' },
  { node: 'qualify', kind: 'in', text: 'Oui carrément, avec plaisir !' },
  { node: 'capture', kind: 'out', text: 'C\'est parti ! Je vous envoie le lien. Voulez-vous aussi débloquer -10% immédiats sur votre commande ?' },
  { node: 'capture', kind: 'in', text: 'Ah oui je veux bien merci !' },
  { node: 'capture', kind: 'out', text: 'Donnez-moi simplement votre email pour activer le code promo :' },
  { node: 'capture', kind: 'in', text: 'maya@homefolk.co' },
  { node: 'capture', kind: 'sys', text: '✅ Lead qualifié & capturé · Code -10% appliqué · Synchro CRM & Shopify' },
]

export interface Scenario {
  id: string
  title: string
  icon: string
  subtitle: string
  userProfile: { name: string; handle: string; channel: string }
  nodes: FlowNode[]
  steps: FlowStep[]
}

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'ecommerce',
    title: 'E-Commerce & Vente Directe',
    icon: '🛍️',
    subtitle: 'Recommandation produit & conversion instantanée',
    userProfile: { name: 'Maya', handle: '@homefolk', channel: 'DM Instagram' },
    nodes: FLOW_NODES,
    steps: FLOW_STEPS,
  },
  {
    id: 'booking',
    title: 'Prise de RDV & Coaching',
    icon: '📅',
    subtitle: 'Qualification de prospect & envoi de lien Calendly',
    userProfile: { name: 'Lucas B.', handle: '@lucas_fit', channel: 'WhatsApp' },
    nodes: [
      { id: 'trigger', label: 'Déclencheur', sub: 'Demande de coaching', x: 20, y: 60, tone: 'a', desc: 'Détecte une demande d\'accompagnement sur DM ou story.' },
      { id: 'ai', label: 'Analyse Besoins', sub: 'IA pose 2 questions', x: 240, y: 20, tone: 'a', desc: 'Identifie le profil et les objectifs du prospect.' },
      { id: 'qualify', label: 'Filtrer Profil', sub: 'Budget & Disponibilité', x: 240, y: 200, tone: 's', desc: 'Vérifie si le prospect correspond à vos critères d\'accompagnement.' },
      { id: 'capture', label: 'Lien Réservation', sub: 'Cal.com / Calendly', x: 460, y: 140, tone: 'a', desc: 'Envoie un lien personnalisé avec créneau pré-sélectionné.' },
      { id: 'handoff', label: 'Relais Prioritaire', sub: 'Avis sur mesure', x: 460, y: 296, tone: 's', desc: 'Notifie le coach sur mobile pour les demandes haut de gamme.' },
    ],
    steps: [
      { node: 'trigger', kind: 'in', text: 'Bonjour ! Avez-vous des créneaux pour un suivi personnalisé ce mois-ci ?' },
      { node: 'ai', kind: 'out', text: 'Hello Lucas ! Oui absolument. Quel est votre objectif principal (perte de poids, prise de masse ou prépa) ?' },
      { node: 'qualify', kind: 'in', text: 'Plutôt prépa marathon pour le printemps.' },
      { node: 'capture', kind: 'out', text: 'Parfait, c\'est notre spécialité ! Voici mon calendrier direct pour réserver votre bilan offert de 15min :' },
      { node: 'capture', kind: 'sys', text: 'Rendez-vous pré-réservé · Notification envoyée' },
    ],
  },
  {
    id: 'support',
    title: 'SAV & FAQ Instantanée',
    icon: '⚡',
    subtitle: 'Résolution automatique des questions récurrentes 24/7',
    userProfile: { name: 'Camille R.', handle: '@cam_r', channel: 'Messenger' },
    nodes: [
      { id: 'trigger', label: 'Déclencheur', sub: 'Question suivi / produit', x: 20, y: 60, tone: 'a', desc: 'Reconnaît les questions sur les commandes ou le stock.' },
      { id: 'ai', label: 'Lookup API', sub: 'Vérification transporteur', x: 240, y: 20, tone: 'a', desc: 'Interroge l\'API Logistique sans temps d\'attente.' },
      { id: 'qualify', label: 'Statut Colis', sub: 'En transit / Livré', x: 240, y: 200, tone: 's', desc: 'Détermine si le colis requiert une action spécifique.' },
      { id: 'capture', label: 'Réponse & Lien', sub: 'Numéro de suivi', x: 460, y: 140, tone: 'a', desc: 'Transmet directement le lien Colissimo/DHL actualisé.' },
      { id: 'handoff', label: 'Litige SAV', sub: 'Transfert agent humain', x: 460, y: 296, tone: 's', desc: 'Ouvre un ticket et alerte l\'équipe SAV en cas de problème de livraison.' },
    ],
    steps: [
      { node: 'trigger', kind: 'in', text: 'Bonjour, où en est ma commande #CMD-8921 ?' },
      { node: 'ai', kind: 'out', text: 'Bonjour Camille ! Je regarde ça tout de suite avec le service logistique…' },
      { node: 'capture', kind: 'out', text: 'Votre colis est en cours de livraison Colissimo, arrivée prévue demain avant 13h ! Voici votre lien de suivi :' },
      { node: 'capture', kind: 'sys', text: 'Ticket résolu à 100% · Satisfaction ⭐⭐⭐⭐⭐' },
    ],
  },
]

export interface LogoItem {
  name: string
  /** Official brand SVG inner markup — parent sets width/height to 24 */
  svgContent: string
  accentColor: string
}

export const LOGO_STRIP: LogoItem[] = [
  {
    name: 'Instagram',
    accentColor: '#e1306c',
    svgContent: `<defs><radialGradient id="ig-g" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig-g)"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="white" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="white"/>`,
  },
  {
    name: 'WhatsApp',
    accentColor: '#25d366',
    svgContent: `<rect width="24" height="24" rx="6" fill="#25d366"/><path d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12c0 1.32.34 2.6.98 3.72L4.5 19.5l3.88-.95A7.48 7.48 0 0 0 12 19.5c4.14 0 7.5-3.36 7.5-7.5S16.14 4.5 12 4.5zm3.6 10.35c-.15.43-1.5.84-1.95.84s-.9-.06-2.07-.54c-1.73-.72-2.85-2.4-2.94-2.52-.09-.12-.75-1-.75-1.89s.48-1.35.66-1.53c.15-.16.33-.2.45-.2l.33.01c.12 0 .27-.03.42.33l.6 1.44c.06.12.09.27.03.42l-.24.3-.3.36c-.12.12-.24.24-.12.48.15.24.6.99 1.29 1.6.9.78 1.62 1.03 1.86 1.14.24.12.39.09.54-.06l.36-.42c.15-.18.3-.12.51-.03l1.41.66c.21.09.36.18.42.27.06.12-.09.81-.24 1.14z" fill="white"/>`,
  },
  {
    name: 'Messenger',
    accentColor: '#0084ff',
    svgContent: `<defs><linearGradient id="ms-g" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#0695ff"/><stop offset="100%" stop-color="#a334fa"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ms-g)"/><path d="M12 4C7.58 4 4 7.3 4 11.4c0 2.2 1.06 4.16 2.72 5.5V19.5l2.54-1.4c.68.19 1.4.3 2.74.3 4.42 0 8-3.3 8-7.4C20 7.3 16.42 4 12 4zm.8 9.96l-2.04-2.18-3.98 2.18 4.38-4.64 2.08 2.18 3.94-2.18-4.38 4.64z" fill="white"/>`,
  },
  {
    name: 'Shopify',
    accentColor: '#96bf48',
    svgContent: `<rect width="24" height="24" rx="6" fill="#96BF48"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16.3 6.09c-.1-.07-.24-.05-.33.02-.08.06-1.92 1.42-1.92 1.42s-1.11-.32-1.43-.41c-.3-.08-.63.01-.85.24-.2.21-.32.5-.32.8v.29l-1.1.32c-.48.14-.85.5-1 .98l-.9 3.03c-.14.46-.05.96.24 1.34.28.37.72.59 1.18.59h.28l-.3 2.23c-.04.3.08.6.31.8.19.17.44.26.7.26.05 0 .1 0 .15-.01l3.86-.52c.4-.05.76-.28.98-.62l2.38-3.73c.22-.35.27-.78.13-1.17l-2-5.51c-.11-.3-.36-.5-.67-.55zm-3.88 4.06v-.54c0-.12.05-.24.13-.33.05-.05.12-.08.18-.09.04 0 .07 0 .1.01l.6.17-.24.82-.77-.04zm1.83.52l.55-1.88.37.1-.55 1.88-.37-.1zm.98.27l.55-1.88.28.08-.55 1.88-.28-.08z" fill="white"/>`,
  },
]


export const METRICS = [
  { value: '480M', label: 'Messages automatisés' },
  { value: '+38%', label: 'Hausse moyenne de conversion' },
  { value: '2.1s', label: 'Temps de réponse médian' },
  { value: '82%', label: 'Résolus sans humain' },
]

export interface Feature {
  title: string
  body: string
  tone: 'a' | 's'
}

export const FEATURES: Feature[] = [
  { title: 'Une IA qui vous ressemble', tone: 'a', body: "Formez-la sur votre site, votre FAQ et vos cent dernières conversations. Elle répond avec vos prix, vos politiques, vos blagues — pas du remplissage de chatbot." },
  { title: 'Des flows à dessiner, pas à coder', tone: 's', body: 'Glissez cinq nœuds, connectez-les, publiez. Ce qui prend un après-midi dans les outils historiques prend quelques minutes ici — et l\'IA comble les trous entre vos branches.' },
  { title: 'Des leads qui se classent tout seuls', tone: 'a', body: 'Emails, numéros de téléphone et intention d\'achat sont capturés en pleine conversation et synchronisés vers votre CRM avec la transcription complète. Rien à exporter, jamais.' },
  { title: 'Des campagnes qui réengagent', tone: 's', body: 'Messages de relance, annonces de nouveautés et rappels de panier abandonné — envoyés dans les fenêtres autorisées pour que votre compte reste en sécurité et vos taux d\'ouverture au-dessus de 80%.' },
  { title: 'Une seule boîte pour l\'équipe', tone: 'a', body: 'Chaque canal arrive dans une inbox partagée unique. Quand l\'IA passe la main, votre collègue récupère la conversation avec le contexte déjà rédigé — plus de "comme je le disais plus haut".' },
  { title: 'Des analyses en revenus, pas en clics', tone: 's', body: 'Voyez quel flow a rapporté de l\'argent, quelle réponse a fait perdre une vente, et ce que votre audience demande sans arrêt. Des rapports que votre client a vraiment envie de lire.' },
]

export interface ChannelInfo {
  title: string
  body: string
  tone: 'a' | 's'
}

export const CHANNEL_INFO: ChannelInfo[] = [
  { title: 'DM Instagram', tone: 'a', body: 'Réponses aux stories, déclencheurs sur commentaires, automatisation des DM — tout l\'entonnoir d\'un post jusqu\'à l\'achat, sans quitter l\'app.' },
  { title: 'WhatsApp', tone: 's', body: 'API Business officielle — expéditeur vérifié, catalogues, paiements et modèles de diffusion approuvés et gérés pour vous.' },
  { title: 'Messenger', tone: 'a', body: 'Boîte de la page, clic-to-message publicitaire et notifications récurrentes — le canal discret et efficace que vos concurrents ont oublié.' },
]

export interface Testimonial {
  quote: string
  initials: string
  name: string
  role: string
  tone: 'a' | 's'
}

export const TESTIMONIALS: Testimonial[] = [
  { quote: 'On a basculé 14 comptes clients en une semaine. Le temps de réponse est passé d\'heures à secondes, et nos contrats se renouvellent tout seuls maintenant.', initials: 'DK', name: 'Dana K.', role: 'Fondatrice, Relay Social — agence', tone: 'a' },
  { quote: "L'IA a répondu à 82% de nos DM pendant les fêtes. On n'a embauché aucun saisonnier — et les ventes ont grimpé de 41%.", initials: 'TR', name: 'Tomás R.', role: 'Co-fondateur, Sundial Goods — e-commerce', tone: 's' },
  { quote: "Je publie, je dors, mes DM vendent ma formation. Ça sonne vraiment comme moi — mon audience ne fait pas la différence, et honnêtement moi non plus.", initials: 'PS', name: 'Priya S.', role: 'Créatrice, 890k abonnés', tone: 'a' },
]

export const COMPARISON_ROWS: [string, string, string][] = [
  ['Réponses', 'IA native, avec votre ton de marque', 'Déclencheurs par mots-clés et menus figés'],
  ['Créer un flow', 'Dessiné en quelques minutes ; l\'IA comble les trous', 'Des heures de branchements pour chaque cas particulier'],
  ['Capture de leads', 'Automatique, synchronisée au CRM avec transcription', 'Tags manuels et exports CSV'],
  ['Quand le bot bloque', 'Relais confiant vers une boîte d\'équipe partagée', '"Désolé, je n\'ai pas compris."'],
  ['Tarification', 'Forfaits fixes, prévisibles', 'Frais par contact qui grimpent chaque mois'],
]

// PRICING_TIERS previously lived here as a second, fictional pricing model
// (Gratuit/29€/79€) that contradicted the real tarification shown on
// app/(marketing)/pricing/page.tsx (Starter/Pro/Business, DZD). Removed —
// components/landing/pricing.tsx now imports the real tiers from
// lib/marketing-content.ts, the single source of truth for pricing.

export const FAQ_ITEMS = [
  {
    q: 'En quoi est-ce différent des outils type ManyChat ?',
    a: 'Les outils historiques vous obligent à scripter chaque branche avec des mots-clés. Raddlly part d\'une IA qui comprend déjà votre activité — les flows la guident, ils ne la remplacent pas. Vous construisez en quelques minutes et elle gère les questions que vous n\'avez jamais scriptées.',
  },
  {
    q: 'L\'IA va-t-elle vraiment parler comme ma marque ?',
    a: 'Vous connectez votre site, votre FAQ et vos anciennes conversations, puis vous validez quelques exemples de réponses. Ensuite, elle garde votre ton — et chaque modification que vous faites dans l\'inbox l\'entraîne davantage.',
  },
  {
    q: "Que se passe-t-il quand l'IA ne peut pas répondre ?",
    a: 'Elle ne bluffe jamais. En dessous de son seuil de confiance, la conversation part vers votre boîte partagée avec une réponse déjà rédigée et tout le contexte. Vos clients obtiennent un humain ; vous obtenez une longueur d\'avance.',
  },
  {
    q: 'Est-ce conforme aux règles Meta et WhatsApp ?',
    a: "Oui — nous sommes construits uniquement sur les API officielles. Fenêtres de messagerie, approbation des modèles et règles de consentement sont appliquées automatiquement par la plateforme, donc votre compte n'est jamais signalé.",
  },
  {
    q: 'Puis-je migrer mes flows existants ?',
    a: 'Sur tout plan payant, nous les migrons pour vous — flows, contacts, tags et automatisations — généralement sous deux jours ouvrés. Votre ancien bot continue de tourner jusqu\'à ce que la bascule soit effective.',
  },
]
