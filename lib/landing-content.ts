export const CHANNELS = ['DM Instagram', 'Discussions WhatsApp', 'Messagerie Messenger'] as const

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
  { id: 'trigger', label: 'Déclencheur', sub: 'Le DM montre une intention d\'achat', x: 20, y: 60, tone: 'a', desc: 'Se déclenche quand un nouveau DM Instagram correspond à l\'intention visée — pas de liste de mots-clés, l\'IA comprend le sens.' },
  { id: 'ai', label: 'Réponse IA', sub: 'Formée sur votre marque', x: 240, y: 20, tone: 'a', desc: 'Répond avec votre voix et les données produit en temps réel. Vous validez le ton une fois ; il le garde.' },
  { id: 'qualify', label: 'Qualifier', sub: 'Prêt à acheter ?', x: 240, y: 200, tone: 's', desc: 'Note la conversation. Une forte intention passe à la capture ; tout ce qui sort de l\'ordinaire part vers un humain.' },
  { id: 'capture', label: 'Capturer le lead', sub: 'Email → CRM', x: 460, y: 140, tone: 'a', desc: 'Demande l\'email naturellement et le synchronise vers votre CRM avec la transcription complète.' },
  { id: 'handoff', label: 'Relais humain', sub: 'Vers la boîte partagée', x: 460, y: 296, tone: 's', desc: 'Un clic transfère la conversation vers l\'inbox de votre équipe avec un contexte déjà rédigé par l\'IA.' },
]

export interface FlowStep {
  node: string
  kind: 'in' | 'out' | 'sys'
  text: string
}

export const FLOW_STEPS: FlowStep[] = [
  { node: 'trigger', kind: 'in', text: 'Salut ! C\'est combien le set de mugs en céramique ?' },
  { node: 'ai', kind: 'out', text: 'Coucou Maya — le lot de quatre est à 44€, livraison offerte cette semaine. Je vous envoie le lien ?' },
  { node: 'qualify', kind: 'in', text: 'Oui avec plaisir !' },
  { node: 'capture', kind: 'out', text: 'Envoyé ! Vous voulez un code -10% pour votre prochaine commande ? Donnez-moi juste votre email.' },
  { node: 'capture', kind: 'in', text: 'maya@homefolk.co' },
  { node: 'capture', kind: 'sys', text: 'Lead capturé · synchronisé au CRM' },
]

export const LOGO_STRIP = ['Homefolk', 'Sundial', 'Kettle&Co', 'RELAY SOCIAL', 'Moonrise', 'Fable', 'Petal & Stem']

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
    a: 'Les outils historiques vous obligent à scripter chaque branche avec des mots-clés. Instaflow part d\'une IA qui comprend déjà votre activité — les flows la guident, ils ne la remplacent pas. Vous construisez en quelques minutes et elle gère les questions que vous n\'avez jamais scriptées.',
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
