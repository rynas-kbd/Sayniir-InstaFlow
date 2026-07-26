export type CopilotProviderKind = 'groq' | 'anthropic' | 'openai' | 'openrouter' | 'deepseek' | 'gemini'

export interface ProviderConfigEntry {
  label: string
  /** Absent for Anthropic — it uses the native Messages API adapter, not the OpenAI-compatible one. */
  baseUrl?: string
  defaultModel: string
}

export const PROVIDER_CONFIG: Record<CopilotProviderKind, ProviderConfigEntry> = {
  groq: { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
  anthropic: { label: 'Anthropic', defaultModel: 'claude-opus-5' },
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o-mini' },
  openrouter: { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'openai/gpt-4o-mini' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1/chat/completions', defaultModel: 'deepseek-chat' },
  // Google's OpenAI-compatibility endpoint, not the native generateContent API — lets Gemini share
  // the same adapter as the other 4 instead of a bespoke streaming/tool-calling implementation.
  gemini: { label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', defaultModel: 'gemini-1.5-flash' },
}

/** BYOK model picker — starts with 1-2 models per provider, meant to grow. */
export const COPILOT_MODEL_CATALOG: Record<CopilotProviderKind, { value: string; label: string }[]> = {
  groq: [{ value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' }],
  anthropic: [
    { value: 'claude-opus-5', label: 'Claude Opus 5' },
    { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  ],
  openai: [{ value: 'gpt-4o-mini', label: 'GPT-4o mini' }],
  openrouter: [{ value: 'openai/gpt-4o-mini', label: 'GPT-4o mini (OpenRouter)' }],
  deepseek: [{ value: 'deepseek-chat', label: 'DeepSeek Chat' }],
  gemini: [{ value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }],
}

export const COPILOT_MAX_TOKENS = 4096
/** Above this, history is evicted (oldest-first, keeping the last user turn) before the next call. */
export const MAX_HISTORY_TOKENS = 40000
