import { createAdminClient } from '../supabase/admin.ts'
import { PlanKey } from '../plans.ts'

export interface PlanLimits {
  contacts: number
  channels: number
  replies: number
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    contacts: 1000,
    channels: 1,
    replies: 100, // per month
  },
  pro: {
    contacts: 10000,
    channels: 3,
    replies: Infinity,
  },
  premium: {
    contacts: Infinity,
    channels: Infinity,
    replies: Infinity,
  },
}

export async function getUserPlanAndSubscription(userId: string) {
  const supabase = createAdminClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  const plan: PlanKey = (sub?.plan as PlanKey) ?? 'free'
  const isActive = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  return { plan, isActive, limits: PLAN_LIMITS[plan] }
}

export async function getPlanByChannelAccount(channelAccountId: string) {
  const supabase = createAdminClient()
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('user_id')
    .eq('id', channelAccountId)
    .maybeSingle()

  if (!account) return { plan: 'free' as PlanKey, isActive: false, limits: PLAN_LIMITS.free }
  return getUserPlanAndSubscription(account.user_id)
}

/**
 * Checks if a user is allowed to connect another channel.
 */
export async function checkChannelLimit(userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const supabase = createAdminClient()
  const { plan, limits } = await getUserPlanAndSubscription(userId)

  if (limits.channels === Infinity) {
    return { allowed: true, count: 0, limit: Infinity }
  }

  const { count } = await supabase
    .from('channel_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const currentCount = count ?? 0
  return {
    allowed: currentCount < limits.channels,
    count: currentCount,
    limit: limits.channels,
  }
}

/**
 * Checks if a channel account is allowed to add a new contact.
 */
export async function checkContactLimit(channelAccountId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { plan, limits, isActive } = await getPlanByChannelAccount(channelAccountId)

  if (limits.contacts === Infinity) return true

  // Get all channel accounts for this user to calculate total contacts
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('user_id')
    .eq('id', channelAccountId)
    .maybeSingle()

  if (!account) return false

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', account.user_id)

  const accountIds = (accounts ?? []).map((a) => a.id)

  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .in('channel_account_id', accountIds)

  return (count ?? 0) < limits.contacts
}

/**
 * Checks if a channel account has reached its monthly AI auto-reply limit.
 */
export async function checkAutoReplyLimit(channelAccountId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { plan, limits } = await getPlanByChannelAccount(channelAccountId)

  if (limits.replies === Infinity) return true

  // Get all channel accounts for this user to calculate total replies this month
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('user_id')
    .eq('id', channelAccountId)
    .maybeSingle()

  if (!account) return false

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', account.user_id)

  const accountIds = (accounts ?? []).map((a) => a.id)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true })
    .in('channel_account_id', accountIds)
    .eq('auto_reply_sent', true)
    .gte('replied_at', startOfMonth.toISOString())

  return (count ?? 0) < limits.replies
}
