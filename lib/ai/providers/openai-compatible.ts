import type { CanonicalContentBlock, CanonicalMessage, ProviderStopReason, ProviderStreamEvent, ProviderTurnParams } from './types'

interface OpenAiToolCallParam {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  tool_calls?: OpenAiToolCallParam[]
  tool_call_id?: string
}

interface OpenAiStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null
      tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>
    }
    finish_reason?: string | null
  }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }
}

interface ToolCallAccumulator {
  id: string
  name: string
  arguments: string
}

/**
 * `role:'user'` messages holding tool_result blocks are our internal convention for "a tool
 * results turn" (mirrors how Anthropic wants tool results wrapped in a user message) — the
 * OpenAI-compatible wire format instead wants each result as its own `role:'tool'` message, so
 * we unpack them here rather than changing the canonical shape itself.
 */
function toOpenAiMessages(system: string[], messages: CanonicalMessage[]): OpenAiChatMessage[] {
  const out: OpenAiChatMessage[] = []
  if (system.length > 0) out.push({ role: 'system', content: system.join('\n\n') })

  for (const m of messages) {
    if (typeof m.content === 'string') {
      out.push({ role: m.role, content: m.content })
      continue
    }

    if (m.role === 'user') {
      const textParts: string[] = []
      for (const block of m.content) {
        if (block.type === 'text') textParts.push(block.text)
        else if (block.type === 'tool_result') out.push({ role: 'tool', tool_call_id: block.toolUseId, content: block.content })
      }
      if (textParts.length > 0) out.push({ role: 'user', content: textParts.join('\n') })
      continue
    }

    const textParts: string[] = []
    const toolCalls: OpenAiToolCallParam[] = []
    for (const block of m.content) {
      if (block.type === 'text') textParts.push(block.text)
      else if (block.type === 'tool_use') {
        toolCalls.push({ id: block.id, type: 'function', function: { name: block.name, arguments: JSON.stringify(block.input) } })
      }
    }
    out.push({
      role: 'assistant',
      content: textParts.length > 0 ? textParts.join('\n') : null,
      ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    })
  }

  return out
}

function mapFinishReason(reason: string | null): ProviderStopReason {
  if (reason === 'tool_calls') return 'tool_use'
  if (reason === 'stop') return 'end_turn'
  if (reason === 'length') return 'max_tokens'
  return 'other'
}

/**
 * Shared adapter for every OpenAI chat-completions-compatible provider: Groq (platform default),
 * OpenAI, OpenRouter, DeepSeek, and Gemini via Google's OpenAI-compatibility endpoint. Adding a
 * new provider in this family is a config entry in lib/ai/models.ts, not a new file.
 */
export async function streamOpenAiCompatibleTurn(
  params: ProviderTurnParams & { baseUrl: string },
  onEvent: (event: ProviderStreamEvent) => void
): Promise<void> {
  const body = {
    model: params.model,
    messages: toOpenAiMessages(params.system, params.messages),
    tools: params.tools.map((t) => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: t.inputSchema } })),
    tool_choice: 'auto' as const,
    max_tokens: params.maxTokens,
    stream: true,
    stream_options: { include_usage: true },
  }

  const res = await fetch(params.baseUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    onEvent({ type: 'error', message: `Erreur du fournisseur (${res.status}): ${text.slice(0, 300)}` })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let textContent = ''
  const toolCalls = new Map<number, ToolCallAccumulator>()
  let finishReason: string | null = null
  let usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue

      let chunk: OpenAiStreamChunk
      try {
        chunk = JSON.parse(payload) as OpenAiStreamChunk
      } catch {
        continue
      }

      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens ?? 0,
          outputTokens: chunk.usage.completion_tokens ?? 0,
          cacheReadTokens: chunk.usage.prompt_tokens_details?.cached_tokens ?? 0,
        }
      }

      const choice = chunk.choices?.[0]
      if (!choice) continue

      const delta = choice.delta ?? {}
      if (typeof delta.content === 'string' && delta.content.length > 0) {
        textContent += delta.content
        onEvent({ type: 'text_delta', delta: delta.content })
      }

      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0
          const existing = toolCalls.get(index) ?? { id: '', name: '', arguments: '' }
          if (tc.id) existing.id = tc.id
          if (tc.function?.name) existing.name += tc.function.name
          if (tc.function?.arguments) existing.arguments += tc.function.arguments
          toolCalls.set(index, existing)
        }
      }

      if (choice.finish_reason) finishReason = choice.finish_reason
    }
  }

  const content: CanonicalContentBlock[] = []
  if (textContent) content.push({ type: 'text', text: textContent })
  for (const call of toolCalls.values()) {
    let input: unknown = {}
    try {
      input = call.arguments ? JSON.parse(call.arguments) : {}
    } catch {
      input = {}
    }
    content.push({ type: 'tool_use', id: call.id || crypto.randomUUID(), name: call.name, input })
  }

  onEvent({ type: 'message_done', content, stopReason: mapFinishReason(finishReason), usage })
}
