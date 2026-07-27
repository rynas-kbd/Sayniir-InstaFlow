import { createClient } from '../supabase/server'

export interface AnalyticsSummary {
  messagesReceived: number
  autoReplies: number
  responseRate: number
  newContacts: number
  uniqueConversations: number
  totalOutgoing: number
  peakHour: number
}

export interface DayPoint {
  date: string
  messages: number
  replies: number
}

/**
 * Scoped to a single channel account — the one active in the account
 * switcher — rather than the user's full account list. A user with several
 * accounts otherwise gets numbers blended across channels with no way to
 * tell them apart.
 */
export async function getAnalyticsSummary(accountId: string, from: Date, to: Date): Promise<AnalyticsSummary> {
  const supabase = await createClient()

  const [{ count: messagesReceived }, { count: autoReplies }, { count: newContacts }, { data: logs }] = await Promise.all([
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .eq('direction', 'incoming')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .eq('auto_reply_sent', true)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .gte('first_seen_at', from.toISOString())
      .lte('first_seen_at', to.toISOString()),
    supabase
      .from('message_logs')
      .select('direction, created_at, contact_id')
      .eq('channel_account_id', accountId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
  ])

  const received = messagesReceived ?? 0
  const replied = autoReplies ?? 0

  const hourCounts = new Array(24).fill(0)
  const uniqueContacts = new Set<string>()
  let outgoing = 0

  for (const log of logs ?? []) {
    if (log.direction === 'outgoing') outgoing++
    if (log.contact_id) uniqueContacts.add(log.contact_id)
    const hour = new Date(log.created_at).getUTCHours()
    hourCounts[hour]++
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts))

  return {
    messagesReceived: received,
    autoReplies: replied,
    responseRate: received > 0 ? Math.round((replied / received) * 100) : 0,
    newContacts: newContacts ?? 0,
    uniqueConversations: uniqueContacts.size,
    totalOutgoing: outgoing,
    peakHour,
  }
}

export async function getMessagesTimeseries(accountId: string, from: Date, to: Date): Promise<DayPoint[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('message_logs')
    .select('created_at, direction, auto_reply_sent')
    .eq('channel_account_id', accountId)
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
