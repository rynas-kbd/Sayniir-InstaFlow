/**
 * Structured, content-free per-turn observability for the inbound dispatch
 * pipeline. Before this there was nothing to tell which route a turn took,
 * which provider/model answered it, or how long it took — only ad hoc
 * console.log/console.error calls scattered across handlers, several of
 * which logged the customer's message or the bot's reply verbatim (see
 * lib/meta/messaging.ts's sendReply, fixed alongside this — audit finding
 * F16).
 */
export interface TurnTelemetry {
  accountId: string
  /** Platform sender id — hashed before logging, never the raw value. */
  senderId: string
  route: string
  provider?: string | null
  model?: string | null
  latencyMs: number
  outcome: 'replied' | 'no_reply' | 'error'
}

/** Non-cryptographic hash — good enough to correlate repeat turns from the
 *  same sender across log lines without ever writing the raw platform id. */
function hashSenderId(senderId: string): string {
  let hash = 0
  for (let i = 0; i < senderId.length; i++) {
    hash = (hash * 31 + senderId.charCodeAt(i)) | 0
  }
  return `s_${(hash >>> 0).toString(36)}`
}

export function logTurn(t: TurnTelemetry): void {
  console.log(
    JSON.stringify({
      event: 'agent_turn',
      at: new Date().toISOString(),
      accountId: t.accountId,
      senderId: hashSenderId(t.senderId),
      route: t.route,
      provider: t.provider ?? null,
      model: t.model ?? null,
      latencyMs: t.latencyMs,
      outcome: t.outcome,
    })
  )
}
