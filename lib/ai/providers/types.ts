export type CopilotProviderKind = 'groq' | 'anthropic' | 'openai' | 'openrouter' | 'deepseek' | 'gemini'

export type CanonicalContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; toolUseId: string; content: string; isError?: boolean }

export interface CanonicalMessage {
  role: 'user' | 'assistant'
  content: string | CanonicalContentBlock[]
}

export interface ProviderTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ProviderUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
}

export type ProviderStopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'other'

export type ProviderStreamEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'message_done'; content: CanonicalContentBlock[]; stopReason: ProviderStopReason; usage: ProviderUsage }
  | { type: 'error'; message: string }

export interface ProviderTurnParams {
  apiKey: string
  model: string
  /** Ordered blocks — the Anthropic adapter gives each its own cache_control breakpoint; others just concatenate. */
  system: string[]
  tools: ProviderTool[]
  messages: CanonicalMessage[]
  maxTokens: number
}
