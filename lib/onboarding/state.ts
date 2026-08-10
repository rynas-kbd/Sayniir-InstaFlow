import 'server-only'
import { createClient } from '@/lib/supabase/server.ts'
import { resolveActiveAccount } from '@/lib/accounts/active-account.ts'
import { ONBOARDING_STEPS, type OnboardingStepId } from './steps.ts'

export interface OnboardingState {
  currentStepId: OnboardingStepId | null // null once all 3 are done
  completed: Record<OnboardingStepId, boolean>
  isActivated: boolean
  businessType: string
  primaryGoal: string | null
}

/**
 * Derives onboarding progress from real database state rather than a
 * declarative flag — a user who disconnects their only channel after
 * activation must see step 1 reopen, not a checklist frozen at "done".
 * activated_at is the one flag that IS trusted verbatim: it marks a
 * historical fact (the user saw a real reply go out once), not a
 * currently-true condition.
 */
export async function resolveOnboardingState(): Promise<OnboardingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      currentStepId: ONBOARDING_STEPS[0].id,
      completed: { connect_channel: false, create_automation: false, test_it: false },
      isActivated: false,
      businessType: 'ecommerce',
      primaryGoal: null,
    }
  }

  const [{ accounts, active }, { data: profile }] = await Promise.all([
    resolveActiveAccount(),
    supabase
      .from('profiles')
      .select('business_type, primary_goal, activated_at')
      .eq('id', user.id)
      .single(),
  ])

  const connectChannel = accounts.length > 0
  const isActivated = Boolean(profile?.activated_at)

  // create_automation / test_it can only be true for a user who has a
  // channel — no channel means no channel_account_id to scope the query to.
  let createAutomation = false
  if (active) {
    const [{ count: activeFlows }, { count: activeRules }] = await Promise.all([
      supabase
        .from('flows')
        .select('*', { count: 'exact', head: true })
        .eq('channel_account_id', active.id)
        .eq('status', 'active'),
      supabase
        .from('automation_rules')
        .select('*', { count: 'exact', head: true })
        .eq('channel_account_id', active.id)
        .eq('is_active', true),
    ])
    createAutomation = (activeFlows ?? 0) > 0 || (activeRules ?? 0) > 0
  }

  const completed: Record<OnboardingStepId, boolean> = {
    connect_channel: connectChannel,
    create_automation: createAutomation,
    test_it: isActivated,
  }

  const currentStepId = ONBOARDING_STEPS.find((s) => !completed[s.id])?.id ?? null

  return {
    currentStepId,
    completed,
    isActivated,
    businessType: profile?.business_type ?? 'ecommerce',
    primaryGoal: profile?.primary_goal ?? null,
  }
}
