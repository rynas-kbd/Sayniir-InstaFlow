import { describe, test, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, type FakeSupabase } from '../../helpers/fake-supabase'

/**
 * Regression coverage for the Palier C analytics additions — funnel,
 * IA/human split, revenue, and growth-link revenue attribution. These are
 * the numbers /analytics now surfaces; getting the aggregation logic wrong
 * silently misleads a merchant, so the arithmetic is worth pinning down
 * even though the underlying queries are simple.
 */

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => fakeSupabase,
}))

// Imported AFTER the mock above is registered, per vitest's hoisting contract.
const { getConversionFunnel, getHandlingSplit, getRevenueSummary, getRevenueByAcquisitionSource } = await import('@/lib/analytics/queries')

const from = new Date('2026-08-01T00:00:00Z')
const to = new Date('2026-08-15T00:00:00Z')

beforeEach(() => {
  fakeSupabase = makeFakeSupabase()
})

describe('getConversionFunnel', () => {
  test('reports the three independent counts', async () => {
    fakeSupabase._bareOverrides.message_logs = [{ data: null, error: null, count: 120 }]
    fakeSupabase._bareOverrides.order_sessions = [{ data: null, error: null, count: 18 }]
    fakeSupabase._bareOverrides.orders = [{ data: null, error: null, count: 7 }]

    const result = await getConversionFunnel('acct-1', from, to)
    expect(result).toEqual({ messages: 120, sessionsStarted: 18, ordersConfirmed: 7 })
  })

  test('defaults every count to 0 when the queries return null', async () => {
    const result = await getConversionFunnel('acct-1', from, to)
    expect(result).toEqual({ messages: 0, sessionsStarted: 0, ordersConfirmed: 0 })
  })
})

describe('getHandlingSplit', () => {
  test('splits AI-handled, human-handled, and no-reply from mixed rows', async () => {
    fakeSupabase._bareOverrides.message_logs = [
      // First call: incoming rows for the period.
      {
        data: [{ auto_reply_sent: true }, { auto_reply_sent: true }, { auto_reply_sent: false }, { auto_reply_sent: false }],
        error: null,
      },
      // Second call: count of outgoing rows with no handled_by (manual inbox sends).
      { data: null, error: null, count: 3 },
    ]

    const result = await getHandlingSplit('acct-1', from, to)
    expect(result).toEqual({ aiHandled: 2, humanHandled: 3, noReply: 2 })
  })
})

describe('getRevenueSummary', () => {
  test('computes total revenue and average order value', async () => {
    fakeSupabase._bareOverrides.orders = [{ data: [{ total_amount: 2500 }, { total_amount: 1500 }, { total_amount: 2000 }], error: null }]

    const result = await getRevenueSummary('acct-1', from, to)
    expect(result).toEqual({ totalRevenue: 6000, orderCount: 3, averageOrderValue: 2000 })
  })

  test('average order value is 0 (not NaN) when there are no orders', async () => {
    fakeSupabase._bareOverrides.orders = [{ data: [], error: null }]

    const result = await getRevenueSummary('acct-1', from, to)
    expect(result).toEqual({ totalRevenue: 0, orderCount: 0, averageOrderValue: 0 })
  })
})

describe('getRevenueByAcquisitionSource', () => {
  test('groups revenue by acquisition source, defaulting to organic', async () => {
    fakeSupabase._bareOverrides.orders = [
      {
        data: [
          { total_amount: 1000, contact_id: 'c1' },
          { total_amount: 500, contact_id: 'c2' },
          { total_amount: 700, contact_id: 'c1' },
        ],
        error: null,
      },
    ]
    fakeSupabase._bareOverrides.contacts = [
      { data: [{ id: 'c1', acquisition_source: 'growth_link' }, { id: 'c2', acquisition_source: null }], error: null },
    ]

    const result = await getRevenueByAcquisitionSource('acct-1', from, to)
    expect(result).toEqual([
      { source: 'growth_link', revenue: 1700, orderCount: 2 },
      { source: 'organic', revenue: 500, orderCount: 1 },
    ])
  })

  test('returns an empty list when there are no orders with a linked contact', async () => {
    fakeSupabase._bareOverrides.orders = [{ data: [], error: null }]

    const result = await getRevenueByAcquisitionSource('acct-1', from, to)
    expect(result).toEqual([])
  })
})
