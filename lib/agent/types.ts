/**
 * Shared result type every vertical agent handler (ecommerce Q&A/tunnel,
 * coaching, agency) returns to the dispatch layer.
 *
 * Why this exists: before this, a handler either sent a reply itself and
 * returned `void`/`true` unconditionally, or swallowed an LLM failure and
 * returned as if nothing had happened. The caller (dispatchInboundMessage)
 * then wrote `auto_reply_sent: true` and a fixed `'[Géré par …]'` placeholder
 * into message_logs regardless of whether the customer actually received
 * anything — see audit finding F3/F4. A typed outcome lets the dispatch
 * layer (a) only mark a turn as answered when a message actually went out,
 * (b) fall back to classic rules / the default message on failure instead
 * of leaving the customer with silence, and (c) persist the real reply text
 * instead of a placeholder.
 */
export type AgentOutcome =
  | { status: 'replied'; replyText: string; route: string; confidence?: number }
  | { status: 'no_reply'; reason: string; route: string }
  | { status: 'error'; error: unknown; route: string }
