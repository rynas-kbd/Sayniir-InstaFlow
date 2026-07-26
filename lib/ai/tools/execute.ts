import { createAdminClient } from '../../supabase/admin'
import type { AiTool, ResourceRef, ToolExecContext } from './types'

export interface ToolCallLogContext {
  conversationId: string
}

export type ToolExecutionResult<TOutput> = { ok: true; output: TOutput } | { ok: false; error: string }

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
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
