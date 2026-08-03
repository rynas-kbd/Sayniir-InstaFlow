import { createAdminClient } from '../../supabase/admin'
import type { AiTool, ResourceRef, ToolExecContext } from './types'

export interface ToolCallLogContext {
  conversationId: string
}

export type ToolExecutionResult<TOutput> = { ok: true; output: TOutput } | { ok: false; error: string }

// Most tools throw `new Error(error.message)` straight from a Supabase call,
// so raw PostgREST text (constraint/column/schema names) routinely reaches
// both the model's tool_result and, via ai_messages history, the end user in
// the chat transcript. Tools that want a friendly message already throw one
// (e.g. "Règle introuvable") — those don't match these DB-error shapes and
// pass through unchanged; only the common raw-DB-error patterns are masked.
const DB_ERROR_PATTERNS = [
  /violates .*constraint/i,
  /duplicate key value/i,
  /relation ".*" does not exist/i,
  /column ".*" (does not exist|of relation)/i,
  /permission denied for/i,
  /new row violates row-level security/i,
]

function sanitizeToolError(message: string): string {
  if (DB_ERROR_PATTERNS.some((p) => p.test(message))) {
    return "Une erreur est survenue lors de l'exécution de cette action."
  }
  return message
}

/**
 * Verifies every declared resourceRef belongs to the account, using the admin client for the
 * check itself only — the tool's own run() still gets the RLS-scoped client. This is the one
 * privileged place that touches cross-tenant data, so a tool author never has to.
 */
async function verifyResourceRefs(refs: ResourceRef[], channelAccountId: string): Promise<boolean> {
  if (refs.length === 0) return true
  const supabase = createAdminClient()
  for (const ref of refs) {
    const { data } = await supabase
      .from(ref.table)
      .select('id')
      .eq('id', ref.id)
      .eq('channel_account_id', channelAccountId)
      .maybeSingle()
    if (!data) return false
  }
  return true
}

async function recordDenial(toolName: string, input: unknown, ctx: ToolExecContext, log: ToolCallLogContext): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await supabase.from('ai_tool_calls').insert({
    conversation_id: log.conversationId,
    channel_account_id: ctx.channelAccountId,
    tool_name: toolName,
    input: input as Record<string, unknown>,
    risk: 'read',
    status: 'denied',
    expires_at: now,
    resolved_at: now,
  })
}

export async function executeAiTool<TInput, TOutput>(
  tool: AiTool<TInput, TOutput>,
  input: TInput,
  ctx: ToolExecContext,
  log: ToolCallLogContext
): Promise<ToolExecutionResult<TOutput>> {
  const refs = tool.resourceRefs?.(input) ?? []
  const verified = await verifyResourceRefs(refs, ctx.channelAccountId)
  if (!verified) {
    await recordDenial(tool.name, input, ctx, log)
    return { ok: false, error: 'Ressource introuvable ou non autorisée' }
  }

  try {
    const output = await tool.run(input, ctx)
    return { ok: true, output }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { ok: false, error: sanitizeToolError(message) }
  }
}
