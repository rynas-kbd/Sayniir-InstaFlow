import { createAdminClient } from './admin.ts'
import { isSandbox } from '@/lib/channels/sandbox.ts'

/**
 * Tables the inbound dispatch path (lib/channels/shared/inbound.ts,
 * lib/flows/engine.ts) writes to as a side effect of processing a message.
 * Every write to one of these must be suppressed during an onboarding
 * simulation — none of it may leave a trace in the inbox, CRM, analytics,
 * or account status. Reads are untouched (see wrapTable below): the
 * simulator needs real message/contact/flow state to produce a truthful
 * reply, it just must not commit any of its own.
 */
const SANDBOXED_WRITE_TABLES = new Set([
  'message_logs',
  'comment_logs',
  'contacts',
  'flow_runs',
  'flow_node_events',
  'channel_accounts', // deactivateAccount() on a (simulated) expired-token path must not touch the real account
  'growth_links',
  'order_sessions',
])

const WRITE_METHODS = new Set(['insert', 'upsert', 'update', 'delete'])

/**
 * A chainable, thenable stand-in for a PostgREST query builder that always
 * resolves to an empty success result. Any property access (.eq(), .select(),
 * .single(), ...) returns a function that yields this same no-op chain again,
 * so arbitrary call-site chaining after .update(...)/.insert(...) keeps
 * working without this file needing to know every PostgREST method name.
 */
function noopBuilder(): PromiseLike<{ data: null; error: null; count: null }> {
  const resolved = Promise.resolve({ data: null, error: null, count: null })
  return new Proxy(resolved, {
    get(target, prop, receiver) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Reflect.get(target, prop, receiver).bind(target)
      }
      return () => noopBuilder()
    },
  }) as unknown as PromiseLike<{ data: null; error: null; count: null }>
}

function wrapTableForSandbox<T>(builder: T): T {
  return new Proxy(builder as object, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && WRITE_METHODS.has(prop)) {
        return () => noopBuilder()
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as T
}

/**
 * createAdminClient() variant for code reachable from dispatchInboundMessage/
 * dispatchInboundComment/runFlowsForInbound. Identical to the real admin
 * client outside a sandbox context (see lib/channels/sandbox.ts). Inside
 * one, `.from(table)` for any table in SANDBOXED_WRITE_TABLES returns a
 * builder whose write verbs are no-ops — this is the single choke point
 * behind the "a test message leaves no trace" guarantee, rather than a
 * guard duplicated at each of the 25+ individual write call sites across
 * inbound.ts and flows/engine.ts (upsertContact() is the one exception,
 * guarded directly in lib/contacts/service.ts since it owns its own client).
 */
export function createDispatchAdminClient() {
  const real = createAdminClient()
  if (!isSandbox()) return real

  return new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (table: string) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builder = (target as any).from(table)
          return SANDBOXED_WRITE_TABLES.has(table) ? wrapTableForSandbox(builder) : builder
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as ReturnType<typeof createAdminClient>
}
