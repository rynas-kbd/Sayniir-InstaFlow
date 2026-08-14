/**
 * Declarative source of truth for the 3-step activation checklist shown on
 * /dashboard until the user is activated. Consumed by the checklist UI and
 * by lib/onboarding/state.ts — never duplicated as a second hardcoded list.
 */
export type OnboardingStepId = 'connect_channel' | 'create_automation' | 'test_it'

export interface OnboardingStepDef {
  id: OnboardingStepId
  order: number
  titleKey: string
  descriptionKey: string
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'connect_channel',
    order: 1,
    titleKey: 'onboardingActivation.steps.connectChannel.title',
    descriptionKey: 'onboardingActivation.steps.connectChannel.description',
  },
  {
    id: 'create_automation',
    order: 2,
    titleKey: 'onboardingActivation.steps.createAutomation.title',
    descriptionKey: 'onboardingActivation.steps.createAutomation.description',
  },
  {
    id: 'test_it',
    order: 3,
    titleKey: 'onboardingActivation.steps.testIt.title',
    descriptionKey: 'onboardingActivation.steps.testIt.description',
  },
]

/** Maps the Phase 1 "primary_goal" answer to the flow template pre-selected at step 2. */
export const GOAL_TO_TEMPLATE_ID: Record<string, string> = {
  reply_faster: 'welcome',
  automate_faq: 'faq_keyword',
  convert_comments: 'comment_funnel',
  qualify_leads: 'ai_qualify_followup',
  // Boutique-only goal (see welcome-form.tsx) — also activates the ecommerce
  // sales agent directly, see activation-checklist.tsx's onCreated handler.
  sell_more: 'sell_more_promo',
}
