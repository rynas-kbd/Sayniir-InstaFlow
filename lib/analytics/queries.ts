import { createClient } from '../supabase/server.ts'

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

export interface ConversionFunnel {
  messages: number
  sessionsStarted: number
  ordersConfirmed: number
}

/**
 * message → order-taking session → confirmed order, over the period. Three
 * independent counts (not a strict subset relationship — a session started
 * one day can confirm the next) but together they're the funnel a merchant
 * actually cares about: how many conversations turn into carts, and how
 * many carts turn into sales.
 */
export async function getConversionFunnel(accountId: string, from: Date, to: Date): Promise<ConversionFunnel> {
  const supabase = await createClient()
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const [{ count: messages }, { count: sessionsStarted }, { count: ordersConfirmed }] = await Promise.all([
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .eq('direction', 'incoming')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('order_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
  ])

  return { messages: messages ?? 0, sessionsStarted: sessionsStarted ?? 0, ordersConfirmed: ordersConfirmed ?? 0 }
}

export interface HandlingSplit {
  aiHandled: number
  humanHandled: number
  noReply: number
}

/**
 * Who actually answered, over the period. AI-handled and no-reply are read
 * off the incoming row's own auto_reply_sent flag (set once per message by
 * dispatchInboundMessage — see lib/channels/shared/inbound.ts::logOutcome).
 * Human-handled counts manual inbox replies instead of trying to correlate
 * them back to a specific incoming message: a human reply is logged as its
 * own outgoing row with no `handled_by` (see app/api/inbox/send/route.ts) —
 * automation never writes a separate outgoing row, it updates the incoming
 * one in place — so `handled_by IS NULL` on an outgoing row is exactly "a
 * human sent this".
 */
export async function getHandlingSplit(accountId: string, from: Date, to: Date): Promise<HandlingSplit> {
  const supabase = await createClient()
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const [{ data: incoming }, { count: humanHandled }] = await Promise.all([
    supabase
      .from('message_logs')
      .select('auto_reply_sent')
      .eq('channel_account_id', accountId)
      .eq('direction', 'incoming')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('channel_account_id', accountId)
      .eq('direction', 'outgoing')
      .is('handled_by', null)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
  ])

  const aiHandled = (incoming ?? []).filter((r) => r.auto_reply_sent).length
  const noReply = (incoming ?? []).length - aiHandled

  return { aiHandled, humanHandled: humanHandled ?? 0, noReply }
}

export interface RevenueSummary {
  totalRevenue: number
  orderCount: number
  averageOrderValue: number
}

export async function getRevenueSummary(accountId: string, from: Date, to: Date): Promise<RevenueSummary> {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('channel_account_id', accountId)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())

  const rows = orders ?? []
  const totalRevenue = rows.reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
  return { totalRevenue, orderCount: rows.length, averageOrderValue: rows.length ? totalRevenue / rows.length : 0 }
}

export interface AcquisitionSourceRevenue {
  source: string
  revenue: number
  orderCount: number
}

/**
 * Revenue grouped by contacts.acquisition_source (stamped at first contact
 * — see lib/channels/shared/inbound.ts::handleGrowthLink). Only growth
 * links are stamped today (a clean, deterministic signal); everything else
 * groups under 'organic'. Flow/campaign attribution isn't included here —
 * neither orders nor order_sessions reference a flow_id/campaign_id
 * anywhere in this schema, so it would only ever be a time-window
 * correlation, not real attribution (documented in the plan rather than
 * faked as a precise number).
 */
export async function getRevenueByAcquisitionSource(accountId: string, from: Date, to: Date): Promise<AcquisitionSourceRevenue[]> {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, contact_id')
    .eq('channel_account_id', accountId)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .not('contact_id', 'is', null)

  const contactIds = Array.from(new Set((orders ?? []).map((o) => o.contact_id as string)))
  if (contactIds.length === 0) return []

  const { data: contacts } = await supabase.from('contacts').select('id, acquisition_source').in('id', contactIds)
  const sourceByContact = new Map((contacts ?? []).map((c) => [c.id, c.acquisition_source ?? 'organic']))

  const bySource = new Map<string, AcquisitionSourceRevenue>()
  for (const order of orders ?? []) {
    const source = sourceByContact.get(order.contact_id as string) ?? 'organic'
    const entry = bySource.get(source) ?? { source, revenue: 0, orderCount: 0 }
    entry.revenue += order.total_amount ?? 0
    entry.orderCount += 1
    bySource.set(source, entry)
  }

  return Array.from(bySource.values()).sort((a, b) => b.revenue - a.revenue)
}
