import { createClient } from '../supabase/server'

export interface AnalyticsSummary {
  messagesReceived: number
  autoReplies: number
  activeAccounts: number
  totalAccounts: number
  responseRate: number
  newContacts: number
}

export interface DayPoint {
  date: string
  messages: number
  replies: number
}

async function getAccountIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('channel_accounts').select('id').eq('user_id', userId)
  return (data ?? []).map((a) => a.id)
}

export async function getAnalyticsSummary(userId: string, from: Date, to: Date): Promise<AnalyticsSummary> {
  const supabase = await createClient()
  const accountIds = await getAccountIds(userId)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const [{ data: accounts }, { count: messagesReceived }, { count: autoReplies }, { count: newContacts }] = await Promise.all([
    supabase.from('channel_accounts').select('id, is_active').in('id', safeIds),
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .eq('direction', 'incoming')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .eq('auto_reply_sent', true)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .gte('first_seen_at', from.toISOString())
      .lte('first_seen_at', to.toISOString()),
  ])

  const totalAccounts = accounts?.length ?? 0
  const activeAccounts = (accounts ?? []).filter((a) => a.is_active).length
  const received = messagesReceived ?? 0
  const replied = autoReplies ?? 0

  return {
    messagesReceived: received,
    autoReplies: replied,
    activeAccounts,
    totalAccounts,
    responseRate: received > 0 ? Math.round((replied / received) * 100) : 0,
    newContacts: newContacts ?? 0,
  }
}

export async function getMessagesTimeseries(userId: string, from: Date, to: Date): Promise<DayPoint[]> {
  const supabase = await createClient()
  const accountIds = await getAccountIds(userId)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const { data } = await supabase
    .from('message_logs')
    .select('created_at, direction, auto_reply_sent')
    .in('channel_account_id', safeIds)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())

  const buckets = new Map<string, DayPoint>()
  const cursor = new Date(from)
  while (cursor <= to) {
    const key = cursor.toISOString().split('T')[0]
    buckets.set(key, { date: key, messages: 0, replies: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const row of data ?? []) {
    const key = row.created_at.split('T')[0]
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (row.direction === 'incoming') bucket.messages += 1
    if (row.auto_reply_sent) bucket.replies += 1
  }

  return Array.from(buckets.values())
}
