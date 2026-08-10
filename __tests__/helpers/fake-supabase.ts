import { vi } from 'vitest'

export type FakeQueryResult = { data: unknown; error: unknown; count?: number }

/**
 * Minimal fake for the `.from(table)...` chain returned by
 * createAdminClient()/createDispatchAdminClient(), scoped to what the
 * dispatch pipeline actually calls: select/eq/neq/order/limit as no-op
 * passthroughs, `.maybeSingle()`/`.single()` consuming a per-table response
 * queue, and a bare `await` (insert/update/upsert with no further chaining)
 * resolving from the inserted/updated payload unless a table explicitly
 * overrides it (used to simulate e.g. an insert failure or a canned read).
 *
 * Shared by handler.test.ts and inbound.test.ts — both need the exact same
 * shape of fake, just wired to different tables/queues per scenario.
 */
export function makeFakeSupabase(singleQueues: Record<string, FakeQueryResult[]> = {}) {
  const inserted: Record<string, unknown[]> = {}
  const updated: Record<string, unknown[]> = {}
  const rpcResponses: Record<string, FakeQueryResult[]> = {}
  const bareOverrides: Record<string, FakeQueryResult[]> = {}

  function builder(table: string) {
    let pending: unknown = null
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      in: () => chain,
      or: () => chain,
      lt: () => chain,
      gt: () => chain,
      lte: () => chain,
      gte: () => chain,
      is: () => chain,
      not: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (obj: unknown) => {
        pending = obj
        ;(inserted[table] ??= []).push(obj)
        return chain
      },
      update: (obj: unknown) => {
        pending = obj
        ;(updated[table] ??= []).push(obj)
        return chain
      },
      upsert: (obj: unknown) => {
        pending = obj
        ;(inserted[table] ??= []).push(obj)
        return chain
      },
      maybeSingle: async () => (singleQueues[table]?.length ? singleQueues[table].shift() : { data: null, error: null }),
      single: async () => (singleQueues[table]?.length ? singleQueues[table].shift() : { data: null, error: null }),
      then: (resolve: (v: FakeQueryResult) => void, reject?: (e: unknown) => void) => {
        const result = bareOverrides[table]?.length ? bareOverrides[table].shift()! : { data: pending, error: null }
        return Promise.resolve(result).then(resolve, reject)
      },
    }
    return chain
  }

  return {
    from: (table: string) => builder(table),
    // Call args are inspectable via `.rpc.mock.calls` (standard vi.fn()).
    rpc: vi.fn(async (name: string) => (rpcResponses[name]?.length ? rpcResponses[name].shift() : { data: null, error: null })),
    _inserted: inserted,
    _updated: updated,
    _rpcResponses: rpcResponses,
    _bareOverrides: bareOverrides,
    _singleQueues: singleQueues,
  }
}

export type FakeSupabase = ReturnType<typeof makeFakeSupabase>
