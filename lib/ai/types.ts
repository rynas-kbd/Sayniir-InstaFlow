export type AiStreamEvent =
  | { t: 'text'; delta: string }
  | { t: 'tool_start'; id: string; name: string }
  | { t: 'tool_result'; id: string; name: string; ok: boolean; summary?: string }
  | { t: 'confirm'; id: string; name: string; label: string; preview: string }
  | { t: 'credits'; used: number; limit: number }
  | { t: 'done'; conversationId: string }
  | { t: 'error'; message: string }

export interface AiTurnInput {
  conversationId: string
  channelAccountId: string
  userId: string
  /** Ignored when mode is 'resume' — the turn continues from persisted history instead. */
  userMessage: string
  /** Pre-rendered context block for the current page (see lib/ai/context). Omitted on a confirm-resume turn. */
  pageContextText?: string
  /** 'resume' continues an existing turn after a write_live confirmation, without appending a new user message. */
  mode?: 'new' | 'resume'
}
