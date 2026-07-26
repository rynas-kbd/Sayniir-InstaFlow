import type { AiStreamEvent } from './types'

export interface NdjsonStream {
  stream: ReadableStream<Uint8Array>
  push: (event: AiStreamEvent) => void
  close: () => void
}

/** One JSON object per line — chosen over SSE because conversations are persisted/resumable by id, not by Last-Event-ID. */
export function createNdjsonStream(): NdjsonStream {
  const encoder = new TextEncoder()
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
    },
  })

  function push(event: AiStreamEvent): void {
    controllerRef?.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
  }

  function close(): void {
    controllerRef?.close()
    controllerRef = null
  }

  return { stream, push, close }
}
