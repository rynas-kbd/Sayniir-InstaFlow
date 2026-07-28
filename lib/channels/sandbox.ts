import { AsyncLocalStorage } from 'async_hooks'

/**
 * A message captured by a sandboxed ChannelAdapter (see registry.ts) instead
 * of actually being sent to Meta.
 */
export interface CapturedMessage {
  text: string
  buttons?: Array<{ title: string; url?: string; payload?: string }>
  card?: { title: string; subtitle?: string; imageUrl?: string }
}

interface SandboxContext {
  sink: CapturedMessage[]
}

const storage = new AsyncLocalStorage<SandboxContext>();

/**
 * Runs `fn` inside a sandbox context: every ChannelAdapter obtained via
 * getAdapter() during `fn`'s execution (including everything it awaits —
 * AsyncLocalStorage follows the async call chain) captures its sends into
 * a buffer instead of calling the real Meta API, and returns that buffer.
 *
 * This is the mechanism behind the onboarding "test it" simulator: it lets
 * dispatchInboundMessage() run for real (rule matching, flow engine, AI
 * agent, default-message fallback) without ever touching Meta or writing
 * to message_logs/contacts/flow_runs — see the isSandbox() guards in
 * inbound.ts and flows/engine.ts for the persistence side of that contract.
 */
export async function runInSandbox<T>(fn: () => Promise<T>): Promise<CapturedMessage[]> {
  const ctx: SandboxContext = { sink: [] }
  await storage.run(ctx, fn)
  return ctx.sink
}

/** True when called from inside a runInSandbox() callback (or anything it awaited). */
export function isSandbox(): boolean {
  return storage.getStore() !== undefined
}

/** Appends a captured message to the active sandbox buffer. No-op outside a sandbox context. */
export function captureSandboxMessage(msg: CapturedMessage): void {
  storage.getStore()?.sink.push(msg)
}
