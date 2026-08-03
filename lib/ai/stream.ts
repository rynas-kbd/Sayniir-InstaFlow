import type { AiStreamEvent } from './types'

export interface NdjsonStream {
  stream: ReadableStream<Uint8Array>
  push: (event: AiStreamEvent) => void
  close: () => void
  /** Resolves once the client has disconnected (tab closed, request aborted) — race this against provider work to stop generating for a departed client and still let billing run in a `finally`. */
  aborted: Promise<void>
}

/** One JSON object per line — chosen over SSE because conversations are persisted/resumable by id, not by Last-Event-ID. */
export function createNdjsonStream(): NdjsonStream {
  const encoder = new TextEncoder()
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null
  let resolveAborted: () => void
  const aborted = new Promise<void>((resolve) => {
    resolveAborted = resolve
  })

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
    },
    cancel() {
      // Client disconnected — stop treating the controller as writable and
      // let anything awaiting `aborted` (the provider loop) unwind cleanly
      // instead of throwing out of push().
      controllerRef = null
      resolveAborted()
    },
  })

  function push(event: AiStreamEvent): void {
    if (!controllerRef) return
    try {
      controllerRef.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
    } catch {
      // Controller already closed/errored (e.g. client aborted between the
      // `cancel()` callback and this call) — never throw from push, or the
      // caller's own error handling (which itself calls push) can double-throw
      // and skip its `finally` (billing) block. See lib/ai/loop.ts.
      controllerRef = null
      resolveAborted()
    }
  }

  function close(): void {
    try {
      controllerRef?.close()
    } catch {
      // Already closed by `cancel()` — closing twice throws, not a real error.
    }
    controllerRef = null
  }

  return { stream, push, close, aborted }
}
