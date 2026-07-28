import { MessageSquareText, Hash, MousePointerClick, Sparkles, FileText, Percent } from 'lucide-react'
import type { FlowNodeType, CardButton } from '@/components/flows/types'

export interface TemplateNode {
  node_key: string
  type: FlowNodeType
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface TemplateEdge {
  source_node_key: string
  target_node_key: string
  source_handle: string
}

export interface FlowTemplate {
  id: string
  label: string
  description: string
  icon: typeof MessageSquareText
  triggerType: string
  triggerKeywords: string[] | null
  namePlaceholder: string
  nodes: TemplateNode[]
  edges: TemplateEdge[]
}

const infoButton: CardButton = { type: 'postback', title: 'Envoie-moi ça 👀' }
const linkButton: CardButton = { type: 'web_url', title: 'Voir maintenant', url: 'https://' }

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'welcome',
    label: 'Message de bienvenue',
    description: 'Répond automatiquement au premier message reçu.',
    icon: MessageSquareText,
    triggerType: 'any_message',
    triggerKeywords: null,
    namePlaceholder: 'Accueil nouveaux contacts',
    nodes: [
      {
        node_key: 'msg1',
        type: 'send_message',
        config: { message_type: 'text', text: 'Bonjour ! 👋 Merci de nous avoir contactés. Comment pouvons-nous vous aider ?' },
        position: { x: 0, y: 200 },
      },
    ],
    edges: [{ source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' }],
  },
  {
    id: 'faq_keyword',
    label: 'Réponse mot-clé (FAQ)',
    description: 'Se déclenche sur des mots-clés précis pour répondre aux questions fréquentes.',
    icon: Hash,
    triggerType: 'keyword',
    triggerKeywords: ['prix', 'tarif', 'info'],
    namePlaceholder: 'FAQ — Prix et tarifs',
    nodes: [
      {
        node_key: 'msg1',
        type: 'send_message',
        config: { message_type: 'text', text: 'Merci pour votre message ! Voici les informations demandées : …' },
        position: { x: 0, y: 200 },
      },
    ],
    edges: [{ source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' }],
  },
  {
    id: 'comment_funnel',
    label: 'Funnel commentaire → bouton → lien',
    description: 'Un commentaire ouvre un DM avec bouton ; le clic envoie un second message avec un lien.',
    icon: MousePointerClick,
    triggerType: 'comment_keyword',
    triggerKeywords: ['info'],
    namePlaceholder: 'Funnel commentaire',
    nodes: [
      {
        node_key: 'msg1',
        type: 'send_message',
        config: { message_type: 'card', card_title: 'Merci pour ton commentaire ! Tu veux en savoir plus ?', card_buttons: [infoButton] },
        position: { x: 0, y: 200 },
      },
      {
        node_key: 'msg2',
        type: 'send_message',
        config: { message_type: 'card', card_title: 'Voici le lien 👇', card_buttons: [linkButton] },
        position: { x: 0, y: 400 },
      },
    ],
    edges: [
      { source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' },
      { source_node_key: 'msg1', target_node_key: 'msg2', source_handle: 'btn-0' },
    ],
  },
  {
    id: 'ai_qualify_followup',
    label: 'Qualification IA + relance',
    description: "L'IA qualifie le besoin, puis une relance est envoyée après un délai.",
    icon: Sparkles,
    triggerType: 'any_message',
    triggerKeywords: null,
    namePlaceholder: 'Qualification + relance',
    nodes: [
      {
        node_key: 'ai1',
        type: 'ai_reply',
        config: { instructions: 'Qualifie le besoin du contact en posant une question claire et concise.' },
        position: { x: 0, y: 200 },
      },
      { node_key: 'delay1', type: 'delay', config: { seconds: 30 }, position: { x: 0, y: 400 } },
      {
        node_key: 'msg1',
        type: 'send_message',
        config: { message_type: 'text', text: "Toujours là ? N'hésitez pas si vous avez d'autres questions 😊" },
        position: { x: 0, y: 600 },
      },
    ],
    edges: [
      { source_node_key: 'trigger', target_node_key: 'ai1', source_handle: 'default' },
      { source_node_key: 'ai1', target_node_key: 'delay1', source_handle: 'default' },
      { source_node_key: 'delay1', target_node_key: 'msg1', source_handle: 'default' },
    ],
  },
  {
    id: 'sell_more_promo',
    label: 'Relance offre spéciale',
    description: 'Se déclenche sur "promo"/"réduction" — envoie une offre puis relance après 1h si pas de réponse.',
    icon: Percent,
    triggerType: 'keyword',
    triggerKeywords: ['promo', 'réduction', 'solde', 'code promo'],
    namePlaceholder: 'Relance offre spéciale',
    // Keyword-triggered, not any_message — this is deliberately narrow so it
    // stays complementary to the ecommerce Q&A/order-taking agent
    // (lib/channels/shared/inbound.ts) rather than competing with it: a
    // message that doesn't match these keywords falls straight through to
    // the agent, unaffected by this flow existing.
    nodes: [
      {
        node_key: 'msg1',
        type: 'send_message',
        config: {
          message_type: 'text',
          text: '🎉 Bonne nouvelle, on a une offre pour vous ! Dites-moi ce qui vous intéresse et je vous aide à finaliser votre commande.',
        },
        position: { x: 0, y: 200 },
      },
      { node_key: 'delay1', type: 'delay', config: { seconds: 3600 }, position: { x: 0, y: 400 } },
      {
        node_key: 'msg2',
        type: 'send_message',
        config: { message_type: 'text', text: "Toujours intéressé(e) par l'offre ? Elle ne dure pas éternellement 😉" },
        position: { x: 0, y: 600 },
      },
    ],
    edges: [
      { source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' },
      { source_node_key: 'msg1', target_node_key: 'delay1', source_handle: 'default' },
      { source_node_key: 'delay1', target_node_key: 'msg2', source_handle: 'default' },
    ],
  },
]

export const BLANK_TEMPLATE = {
  id: 'blank',
  label: 'Vierge',
  description: 'Partez de zéro avec juste un déclencheur.',
  icon: FileText,
}
