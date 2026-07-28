/**
 * Declarative source of truth for the 3-step activation checklist shown on
 * /dashboard until the user is activated. Consumed by the checklist UI and
 * by lib/onboarding/state.ts — never duplicated as a second hardcoded list.
 */
export type OnboardingStepId = 'connect_channel' | 'create_automation' | 'test_it'

export interface OnboardingStepDef {
  id: OnboardingStepId
  order: number
  title: string
  description: string
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'connect_channel',
    order: 1,
    title: 'Connecter un canal',
    description: 'Instagram, Messenger ou WhatsApp — un seul suffit pour commencer.',
  },
  {
    id: 'create_automation',
    order: 2,
    title: 'Créer votre première automatisation',
    description: 'Un template pré-rempli selon votre objectif, prêt en un clic.',
  },
  {
    id: 'test_it',
    order: 3,
    title: 'Tester : voir la réponse partir',
    description: 'Simulez un message reçu et regardez votre automatisation répondre en direct.',
  },
]

/** Maps the Phase 1 "primary_goal" answer to the flow template pre-selected at step 2. */
export const GOAL_TO_TEMPLATE_ID: Record<string, string> = {
  reply_faster: 'welcome',
  automate_faq: 'faq_keyword',
  convert_comments: 'comment_funnel',
  qualify_leads: 'ai_qualify_followup',
}
