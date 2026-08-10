import { createAdminClient } from '../../supabase/admin.ts'
import { getUserPlanAndSubscription } from '../../plans/restrictions.ts'
import { AI_PLAN_LIMITS, type AiPlanLimits } from './limits.ts'

const TOKENS_PER_CREDIT = 1000

export interface CreditCheckResult {
  allowed: boolean
  used: number
  limit: number
  limits: AiPlanLimits
}

/** Pre-flight check — BYOK usage isn't billed against the quota (byok=false filter), so a broken/absent BYOK key falling back to the platform key still gets metered correctly. */
export async function checkAiCreditLimit(userId: string): Promise<CreditCheckResult> {
  const { plan } = await getUserPlanAndSubscription(userId)
  const limits = AI_PLAN_LIMITS[plan]

  const supabase = createAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: events } = await supabase
    .from('ai_usage_events')
    .select('credits')
    .eq('user_id', userId)
    .eq('byok', false)
    .gte('created_at', startOfMonth.toISOString())

  const used = (events ?? []).reduce((sum, e) => sum + (e.credits ?? 0), 0)
  return { allowed: used < limits.monthlyCredits, used, limit: limits.monthlyCredits, limits }
}

/**
 * Records real usage after a turn. Uses the admin client deliberately — ai_usage_events has no
 * INSERT policy for `authenticated` (see the 20260808_ai_credits.sql migration), so billing
 * integrity doesn't depend on trusting the caller's session.
 */
export async function recordAiUsage(params: {
  channelAccountId: string
  userId: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  byok: boolean
}): Promise<void> {
  const supabase = createAdminClient()
  const billableTokens = params.byok ? 0 : params.inputTokens + params.outputTokens
  const credits = Math.ceil(billableTokens / TOKENS_PER_CREDIT)

  await supabase.from('ai_usage_events').insert({
    channel_account_id: params.channelAccountId,
    user_id: params.userId,
    credits,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cache_read_tokens: params.cacheReadTokens,
    byok: params.byok,
  })
}
