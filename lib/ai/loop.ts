import type { SupabaseClient } from '@supabase/supabase-js'
import { COPILOT_MAX_TOKENS, MAX_HISTORY_TOKENS } from './models.ts'
import { buildSystemBlocks, buildProviderTools, pageContextMessage } from './prompt.ts'
import { streamProviderTurn } from './providers/index.ts'
import type { CanonicalContentBlock, CanonicalMessage, CopilotProviderKind, ProviderStopReason } from './providers/types.ts'
import { executeAiTool } from './tools/execute.ts'
import { renderConfirmPreview } from './tools/confirm-preview.ts'
import { getMemoryBlock } from './memory/service.ts'
import { checkAiCreditLimit, recordAiUsage } from './credits/meter.ts'
import type { AiTool, ToolExecContext } from './tools/types.ts'
import type { AiStreamEvent, AiTurnInput } from './types.ts'

const CONFIRM_TTL_MS = 15 * 60 * 1000

/**
 * Read-only "list/search" tools whose result is worth rendering as a
 * structured card in the chat (components/ai/tool-result-card.tsx) instead
 * of only being narrated in prose by the model. Deliberately narrow: these
 * outputs are already tenant-scoped data the model receives verbatim (see
 * executeAiTool below), so handing the same payload to the client opens no
 * new security surface — but every other tool (writes, single-object
 * lookups) stays exactly as narration-only as before.
 */
const DISPLAYABLE_TOOLS = new Set([
  'list_flows',
  'list_products',
  'list_orders',
  'search_contacts',
  'list_automation_rules',
  'list_campaigns',
  'list_contacts',
])

/**
 * Returns a user-friendly progress message for a given tool name.
 * Used to display progress indicators in the UI during tool execution.
 */
function getToolProgressMessage(toolName: string): string | null {
  const progressMessages: Record<string, string> = {
    'create_flow_draft': 'Création du workflow...',
    'add_flow_node': 'Ajout du nœud au workflow...',
    'connect_flow_nodes': 'Connexion des nœuds...',
    'delete_flow_node': 'Suppression du nœud...',
    'set_flow_status': 'Mise à jour du statut du workflow...',
    'get_flow_digest': 'Analyse du workflow...',
    'list_flows': 'Récupération des workflows...',
    'create_product': 'Création du produit...',
    'update_product': 'Mise à jour du produit...',
    'list_products': 'Récupération des produits...',
    'create_segment': 'Création du segment...',
    'create_tag': 'Création du tag...',
    'tag_contact': 'Application du tag...',
    'untag_contact': 'Retrait du tag...',
    'search_contacts': 'Recherche de contacts...',
    'set_contact_bot_paused': 'Mise en pause du bot...',
    'create_snippet': 'Création du snippet...',
    'schedule_campaign': 'Programmation de la campagne...',
    'get_analytics_summary': 'Analyse des statistiques...',
    'list_orders': 'Récupération des commandes...',
    'update_order_status': 'Mise à jour de la commande...',
    'get_lint_findings': 'Analyse des problèmes...',
    'write_memory': 'Enregistrement en mémoire...',
    'update_agent_settings': 'Mise à jour des paramètres...',
  }

  return progressMessages[toolName] ?? null
}

interface DbMessageRow {
  role: 'user' | 'assistant' | 'tool'
  content: unknown
}

/** Rough token estimate (4 chars/token) — good enough for an eviction threshold, not a billing figure. */
function estimateTokens(messages: CanonicalMessage[]): number {
  let chars = 0
  for (const m of messages) {
    chars += typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length
  }
  return Math.ceil(chars / 4)
}

/**
 * Evicts whole oldest turns (a turn = a real user-text message plus every
 * assistant/tool message before the next one) once history exceeds
 * MAX_HISTORY_TOKENS. Trims only at turn boundaries — a tool_result "user"
 * message (array content, from a past tool call) is never mistaken for a
 * turn start — so a tool_use/tool_result pairing is never split, which
 * would reintroduce the corruption class fixed above. Always keeps at
 * least the most recent turn, however large.
 */
export function evictOldHistory(messages: CanonicalMessage[]): CanonicalMessage[] {
  let trimmed = messages
  while (estimateTokens(trimmed) > MAX_HISTORY_TOKENS) {
    const turnStarts = trimmed.reduce<number[]>((acc, m, i) => {
      if (m.role === 'user' && typeof m.content === 'string') acc.push(i)
      return acc
    }, [])
    if (turnStarts.length <= 1) break
    trimmed = trimmed.slice(turnStarts[1])
  }
  return trimmed
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

    const loadedMessages: CanonicalMessage[] = ((historyRows ?? []) as DbMessageRow[]).map((row) => ({
      role: toCanonicalRole(row.role),
      content: row.content as string | CanonicalContentBlock[],
    }))
    // MAX_HISTORY_TOKENS was declared but never enforced — every tool_result
    // payload (e.g. a full list_contacts page) was replayed on every
    // iteration of every future turn, forever, eventually hitting the
    // provider's context ceiling with no recovery path.
    const messages: CanonicalMessage[] = evictOldHistory(loadedMessages)

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
      // Emit thinking event at the start of each iteration
      push({ t: 'thinking', active: true })

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
            // Stop thinking when text starts streaming
            push({ t: 'thinking', active: false })
            push({ t: 'text', delta: event.delta })
          } else if (event.type === 'message_done') {
            push({ t: 'thinking', active: false })
            turnResult.content = event.content
            turnResult.stopReason = event.stopReason
            inputTokens += event.usage.inputTokens
            outputTokens += event.usage.outputTokens
            cacheReadTokens += event.usage.cacheReadTokens
          } else if (event.type === 'error') {
            push({ t: 'thinking', active: false })
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
      // The block gated on confirmation, if any — every tool_use block in an
      // assistant message MUST get a tool_result before the next provider
      // call, or Anthropic/OpenAI-compatible APIs 400 on replay and the
      // conversation is permanently stuck. So instead of `break`ing out and
      // leaving this (and any later) block's tool_result unwritten, every
      // block always gets one: real output, a "not executed yet" placeholder
      // for the one being confirmed, or "skipped" for anything after it.
      let pending: { tool: AiTool<never, unknown>; block: Extract<CanonicalContentBlock, { type: 'tool_use' }> } | null = null

      for (const block of toolUseBlocks) {
        const tool = toolByName.get(block.name)
        if (!tool) {
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: `Outil inconnu: ${block.name}`, isError: true })
          continue
        }

        if (pending) {
          // A confirmation is already pending earlier in this same message —
          // running another write here (even another write_live) without a
          // confirmation UI for it would defeat the gate. Ask the model/user
          // to re-request it once the first one is resolved.
          resultBlocks.push({
            type: 'tool_result',
            toolUseId: block.id,
            content: 'Non exécuté — une confirmation était requise sur une action précédente dans ce tour. Redemandez cette action si nécessaire.',
            isError: true,
          })
          continue
        }

        toolCallCount += 1
        if (toolCallCount > maxToolCalls) {
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: "Limite d'outils atteinte pour ce tour.", isError: true })
          continue
        }

        if (tool.risk === 'write_live') {
          pending = { tool, block }
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: 'En attente de confirmation de l’utilisateur…' })
          continue
        }

        // Emit progress event before executing the tool
        const progressMessage = getToolProgressMessage(tool.name)
        if (progressMessage) {
          push({ t: 'progress', step: progressMessage })
        }

        push({ t: 'tool_start', id: block.id, name: tool.name })
        const result = await executeAiTool(tool, block.input as never, ctx, { conversationId: input.conversationId })
        if (result.ok) {
          push({
            t: 'tool_result',
            id: block.id,
            name: tool.name,
            ok: true,
            output: DISPLAYABLE_TOOLS.has(tool.name) ? result.output : undefined,
          })
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: JSON.stringify(result.output) })
        } else {
          push({ t: 'tool_result', id: block.id, name: tool.name, ok: false, summary: result.error })
          resultBlocks.push({ type: 'tool_result', toolUseId: block.id, content: result.error, isError: true })
        }
      }

      let resultMessageId: string | undefined
      if (resultBlocks.length > 0) {
        const { data: inserted } = await supabase
          .from('ai_messages')
          .insert({ conversation_id: input.conversationId, role: 'tool', content: resultBlocks })
          .select('id')
          .single()
        resultMessageId = inserted?.id
      }

      if (pending) {
        const expiresAt = new Date(Date.now() + CONFIRM_TTL_MS).toISOString()
        const { data: pendingRow, error: pendingError } = await supabase
          .from('ai_tool_calls')
          .insert({
            conversation_id: input.conversationId,
            channel_account_id: input.channelAccountId,
            tool_use_id: pending.block.id,
            tool_name: pending.tool.name,
            input: pending.block.input as Record<string, unknown>,
            risk: pending.tool.risk,
            status: 'pending_confirmation',
            expires_at: expiresAt,
            result_message_id: resultMessageId ?? null,
          })
          .select('id')
          .single()

        if (pendingError || !pendingRow) {
          push({ t: 'error', message: "Impossible d'enregistrer la confirmation en attente. Réessayez." })
          push({ t: 'done', conversationId: input.conversationId })
          return
        }

        push({
          t: 'confirm',
          id: pendingRow.id,
          name: pending.tool.name,
          label: pending.tool.description,
          preview: renderConfirmPreview(pending.tool.name, pending.block.input),
        })
        push({ t: 'done', conversationId: input.conversationId })
        return
      }

      messages.push({ role: 'user', content: resultBlocks })
    }

    push({ t: 'error', message: "Nombre maximum d'itérations atteint pour ce tour." })
    push({ t: 'done', conversationId: input.conversationId })
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
