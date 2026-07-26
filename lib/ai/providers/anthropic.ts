import Anthropic from '@anthropic-ai/sdk'
import type { CanonicalContentBlock, CanonicalMessage, ProviderStreamEvent, ProviderTurnParams } from './types'

function toAnthropicContent(content: string | CanonicalContentBlock[]): Anthropic.MessageParam['content'] {
  if (typeof content === 'string') return content
  return content.map((block): Anthropic.ContentBlockParam => {
    if (block.type === 'text') return { type: 'text', text: block.text }
    if (block.type === 'tool_use') return { type: 'tool_use', id: block.id, name: block.name, input: block.input }
    return { type: 'tool_result', tool_use_id: block.toolUseId, content: block.content, ...(block.isError ? { is_error: true } : {}) }
  })
}

function toAnthropicMessages(messages: CanonicalMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({ role: m.role, content: toAnthropicContent(m.content) }))
}

function fromAnthropicContent(content: Anthropic.ContentBlock[]): CanonicalContentBlock[] {
  const blocks: CanonicalContentBlock[] = []
  for (const block of content) {
    if (block.type === 'text') blocks.push({ type: 'text', text: block.text })
    else if (block.type === 'tool_use') blocks.push({ type: 'tool_use', id: block.id, name: block.name, input: block.input })
  }
  return blocks
}

function mapStopReason(reason: Anthropic.StopReason | null): 'end_turn' | 'tool_use' | 'max_tokens' | 'other' {
  if (reason === 'tool_use') return 'tool_use'
  if (reason === 'end_turn' || reason === 'stop_sequence') return 'end_turn'
  if (reason === 'max_tokens') return 'max_tokens'
  return 'other'
}

/** BYOK-only adapter — the platform default is Groq. See lib/ai/providers/openai-compatible.ts for the other 5 providers. */
export async function streamAnthropicTurn(params: ProviderTurnParams, onEvent: (event: ProviderStreamEvent) => void): Promise<void> {
  const client = new Anthropic({ apiKey: params.apiKey })

  const system: Anthropic.TextBlockParam[] = params.system.map((text) => ({ type: 'text', text, cache_control: { type: 'ephemeral' } }))

  const tools: Anthropic.Tool[] = params.tools.map((tool, index) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    ...(index === params.tools.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
  }))

  const stream = client.messages.stream({
    model: params.model,
    max_tokens: params.maxTokens,
    system,
    tools,
    messages: toAnthropicMessages(params.messages),
  })
  stream.on('text', (delta) => onEvent({ type: 'text_delta', delta }))

  const message = await stream.finalMessage()
  onEvent({
    type: 'message_done',
    content: fromAnthropicContent(message.content),
    stopReason: mapStopReason(message.stop_reason),
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
    },
  })
}
