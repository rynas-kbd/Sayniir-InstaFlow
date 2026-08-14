import { MessageSquareText, Hash, MousePointerClick, Sparkles, FileText, Percent } from 'lucide-react'
import type { FlowNodeType, CardButton } from '@/components/flows/types.ts'
import type { Translator } from '@/lib/i18n/translate'

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

/**
 * Templates carry French/English/Arabic labels/descriptions AND seed content
 * (default message text, button titles, AI instructions) that gets inserted
 * into the merchant's flow when a template is applied — both need to be
 * locale-aware, so this whole module is a function of `t` rather than a
 * static export. See `getNavSections(businessType, t)` in
 * components/app-shell/nav-config.ts for the same pattern.
 */
export function getFlowTemplates(t: Translator): FlowTemplate[] {
  const infoButton: CardButton = { type: 'postback', title: t('flows.templates.commentFunnel.infoButtonTitle') }
  const linkButton: CardButton = { type: 'web_url', title: t('flows.templates.commentFunnel.linkButtonTitle'), url: 'https://' }

  return [
    {
      id: 'welcome',
      label: t('flows.templates.welcome.label'),
      description: t('flows.templates.welcome.description'),
      icon: MessageSquareText,
      triggerType: 'any_message',
      triggerKeywords: null,
      namePlaceholder: t('flows.templates.welcome.namePlaceholder'),
      nodes: [
        {
          node_key: 'msg1',
          type: 'send_message',
          config: { message_type: 'text', text: t('flows.templates.welcome.seedText') },
          position: { x: 0, y: 200 },
        },
      ],
      edges: [{ source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' }],
    },
    {
      id: 'faq_keyword',
      label: t('flows.templates.faqKeyword.label'),
      description: t('flows.templates.faqKeyword.description'),
      icon: Hash,
      triggerType: 'keyword',
      triggerKeywords: ['prix', 'tarif', 'info'],
      namePlaceholder: t('flows.templates.faqKeyword.namePlaceholder'),
      nodes: [
        {
          node_key: 'msg1',
          type: 'send_message',
          config: { message_type: 'text', text: t('flows.templates.faqKeyword.seedText') },
          position: { x: 0, y: 200 },
        },
      ],
      edges: [{ source_node_key: 'trigger', target_node_key: 'msg1', source_handle: 'default' }],
    },
    {
      id: 'comment_funnel',
      label: t('flows.templates.commentFunnel.label'),
      description: t('flows.templates.commentFunnel.description'),
      icon: MousePointerClick,
      triggerType: 'comment_keyword',
      triggerKeywords: ['info'],
      namePlaceholder: t('flows.templates.commentFunnel.namePlaceholder'),
      nodes: [
        {
          node_key: 'msg1',
          type: 'send_message',
          config: { message_type: 'card', card_title: t('flows.templates.commentFunnel.cardTitle1'), card_buttons: [infoButton] },
          position: { x: 0, y: 200 },
        },
        {
          node_key: 'msg2',
          type: 'send_message',
          config: { message_type: 'card', card_title: t('flows.templates.commentFunnel.cardTitle2'), card_buttons: [linkButton] },
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
      label: t('flows.templates.aiQualifyFollowup.label'),
      description: t('flows.templates.aiQualifyFollowup.description'),
      icon: Sparkles,
      triggerType: 'any_message',
      triggerKeywords: null,
      namePlaceholder: t('flows.templates.aiQualifyFollowup.namePlaceholder'),
      nodes: [
        {
          node_key: 'ai1',
          type: 'ai_reply',
          config: { instructions: t('flows.templates.aiQualifyFollowup.instructions') },
          position: { x: 0, y: 200 },
        },
        { node_key: 'delay1', type: 'delay', config: { seconds: 30 }, position: { x: 0, y: 400 } },
        {
          node_key: 'msg1',
          type: 'send_message',
          config: { message_type: 'text', text: t('flows.templates.aiQualifyFollowup.seedText') },
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
      label: t('flows.templates.sellMorePromo.label'),
      description: t('flows.templates.sellMorePromo.description'),
      icon: Percent,
      triggerType: 'keyword',
      triggerKeywords: ['promo', 'réduction', 'solde', 'code promo'],
      namePlaceholder: t('flows.templates.sellMorePromo.namePlaceholder'),
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
            text: t('flows.templates.sellMorePromo.seedText1'),
          },
          position: { x: 0, y: 200 },
        },
        { node_key: 'delay1', type: 'delay', config: { seconds: 3600 }, position: { x: 0, y: 400 } },
        {
          node_key: 'msg2',
          type: 'send_message',
          config: { message_type: 'text', text: t('flows.templates.sellMorePromo.seedText2') },
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
}

export function getBlankTemplate(t: Translator) {
  return {
    id: 'blank',
    label: t('flows.templates.blank.label'),
    description: t('flows.templates.blank.description'),
    icon: FileText,
  }
}
