import type { SupabaseClient } from '@supabase/supabase-js'
import { COPILOT_MAX_TOKENS } from './models'
import { buildSystemBlocks, buildProviderTools, pageContextMessage } from './prompt'
import { streamProviderTurn } from './providers'
import type { CanonicalContentBlock, CanonicalMessage, CopilotProviderKind, ProviderStopReason } from './providers/types'
import { executeAiTool } from './tools/execute'
import { getMemoryBlock } from './memory/service'
import { checkAiCreditLimit, recordAiUsage } from './credits/meter'
import type { AiTool, ToolExecContext } from './tools/types'
import type { AiStreamEvent, AiTurnInput } from './types'

const CONFIRM_TTL_MS = 15 * 60 * 1000

interface DbMessageRow {
  role: 'user' | 'assistant' | 'tool'
  content: unknown
}

/** Tool results are DB role 'tool' but travel as a canonical 'user' message (see lib/ai/prompt.ts and the openai-compatible adapter for why). */
function toCanonicalRole(role: DbMessageRow['role']): 'user' | 'assistant' {
  return role === 'assistant' ? 'assistant' : 'user'
}

export interface RunCopilotTurnOptions {
  provider: { kind: CopilotProviderKind; apiKey: string; model: string }
  tools: AiTool<never, unknown>[]
  maxIterations: number
  maxToolCalls: number
  /** BYOK usage isn't billed against the monthly quota — see lib/ai/credits/meter.ts. */
  byok: boolean
  push: (event: AiStreamEvent) => void
  input: AiTurnInput
  /** RLS-scoped, bound to the requesting user's session — used for both tool execution and message persistence. */
  supabase: SupabaseClient
}

/**
 * Manual agentic loop (not an SDK's built-in tool runner): a write_live tool must be able to
 * pause the turn, persist the pending call, close the HTTP response, and resume on a later
 * request — a flow no in-process runner can model. See docs/AI_NATIVE_DESIGN.md §6.2, §8.2.
 */
export async function runCopilotTurn(options: RunCopilotTurnOptions): Promise<void> {
  const { provider, tools, maxIterations, maxToolCalls, byok, push, input, supabase } = options
  const ctx: ToolExecContext = { supabase, channelAccountId: input.channelAccountId, userId: input.userId }
  const toolByName = new Map(tools.map((t) => [t.name, t]))

  let inputTokens = 0
  let outputTokens = 0
  let cacheReadTokens = 0

  try {
    const { data: historyRows } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', input.conversationId)
      .order('created_at', { ascending: true })

    const messages: CanonicalMessage[] = ((historyRows ?? []) as DbMessageRow[]).map((row) => ({
      role: toCanonicalRole(row.role),
      content: row.content as string | CanonicalContentBlock[],
    }))

    if (input.mode !== 'resume') {
      if (input.pageContextText) {
        messages.push(pageContextMessage(input.pageContextText))
      }

      messages.push({ role: 'user', content: input.userMessage })
      await supabase.from('ai_messages').insert({
        conversation_id: input.conversationId,
        role: 'user',
        content: input.userMessage,
      })
    }

    const providerTools = buildProviderTools(tools)
    const memoryBlock = await getMemoryBlock(supabase, input.channelAccountId)
    const system = buildSystemBlocks(memoryBlock)

    let toolCallCount = 0

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // A plain object rather than several `let`s — TS's control-flow narrowing collapses
      // primitive `let`s reassigned only inside a callback back to their initializer's literal
      // type, which produced bogus `never`/no-overlap errors below. Object property reads don't
      // get that treatment.
      const turnResult: { content: CanonicalContentBlock[] | null; stopReason: ProviderStopReason; hadError: boolean } = {
        content: null,
        stopReason: 'other',
        hadError: false,
      }

      await streamProviderTurn(
        provider.kind,
        { apiKey: provider.apiKey, model: provider.model, system, tools: providerTools, messages, maxTokens: COPILOT_MAX_TOKENS },
        (event) => {
          if (event.type === 'text_delta') {
            push({ t: 'text', delta: event.delta })
          } else if (event.type === 'message_done') {
            turnResult.content = event.content
            turnResult.stopReason = event.stopReason
            inputTokens += event.usage.inputTokens
            outputTokens += event.usage.outputTokens
            cacheReadTokens += event.usage.cacheReadTokens
          } else if (event.type === 'error') {
            turnResult.hadError = true
            push({ t: 'error', message: event.message })
          }
        }
      )

      if (turnResult.hadError) return
      const assistantContent = turnResult.content
      if (!assistantContent) {
        push({ t: 'error', message: 'Aucune réponse du fournisseur IA.' })
        return
      }

      await supabase.from('ai_messages').insert({
        conversation_id: input.conversationId,
        role: 'assistant',
        content: assistantContent,
      })
      messages.push({ role: 'assistant', content: assistantContent })

      if (turnResult.stopReason !== 'tool_use') {
        push({ t: 'done', conversationId: input.conversationId })
        return
      }

      const toolUseBlocks = assistantContent.filter((b): b is Extract<CanonicalContentBlock, { type: 'tool_use' }> => b.type === 'tool_use')
      const resultBlocks: Extract<CanonicalContentBlock, { type: 'tool_result' }>[] = []
      let pausedForConfirmation = false

      for (const block of toolUseBlocks) {
        const tool = toolByName.get(block.name)
        if (!tool) {
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: `Outil inconnu: ${block.name}`, isError: true })
          continue
        }

        if (tool.risk === 'write_live') {
          const expiresAt = new Date(Date.now() + CONFIRM_TTL_MS).toISOString()
          const { data: pending } = await supabase
            .from('ai_tool_calls')
            .insert({
              conversation_id: input.conversationId,
              channel_account_id: input.channelAccountId,
              tool_use_id: block.id,
              tool_name: tool.name,
              input: block.input as Record<string, unknown>,
              risk: tool.risk,
              status: 'pending_confirmation',
              expires_at: expiresAt,
            })
            .select('id')
            .single()

          if (pending) {
            push({ t: 'confirm', id: pending.id, name: tool.name, label: tool.description, preview: tool.description })
          }
          pausedForConfirmation = true
          break
        }

        toolCallCount += 1
        if (toolCallCount > maxToolCalls) {
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: "Limite d'outils atteinte pour ce tour.", isError: true })
          continue
        }

        push({ t: 'tool_start', id: block.id, name: tool.name })
        const result = await executeAiTool(tool, block.input as never, ctx, { conversationId: input.conversationId })
        if (result.ok) {
          push({ t: 'tool_result', id: block.id, name: tool.name, ok: true })
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: JSON.stringify(result.output) })
        } else {
          push({ t: 'tool_result', id: block.id, name: tool.name, ok: false, summary: result.error })
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: result.error, isError: true })
        }
      }

      if (resultBlocks.length > 0) {
        await supabase.from('ai_messages').insert({
          conversation_id: input.conversationId,
          role: 'tool',
          content: resultBlocks,
        })
      }

      if (pausedForConfirmation) return

      messages.push({ role: 'user', content: resultBlocks })
    }

    push({ t: 'error', message: "Nombre maximum d'itérations atteint pour ce tour." })
  } catch (err) {
    push({ t: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' })
  } finally {
    if (inputTokens > 0 || outputTokens > 0) {
      await recordAiUsage({ channelAccountId: input.channelAccountId, userId: input.userId, inputTokens, outputTokens, cacheReadTokens, byok })
      const credits = await checkAiCreditLimit(input.userId)
      push({ t: 'credits', used: credits.used, limit: credits.limit })
    }
  }
}
