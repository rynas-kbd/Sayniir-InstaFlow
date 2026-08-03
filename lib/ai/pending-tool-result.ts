import type { SupabaseClient } from '@supabase/supabase-js'

interface ToolResultBlockLike {
  type: string
  toolUseId?: string
  content?: string
  isError?: boolean
  [key: string]: unknown
}

/**
 * Patches the placeholder tool_result for `toolUseId` inside the ai_messages
 * row `resultMessageId` in place, instead of inserting a second tool_result
 * for the same tool_use id (which would leave two, possibly conflicting,
 * results for one id — see lib/ai/loop.ts and migration
 * 20260819_ai_tool_calls_result_message.sql for why the pausing turn always
 * writes a complete placeholder message up front).
 */
export async function patchPendingToolResult(
  supabase: SupabaseClient,
  resultMessageId: string | null | undefined,
  toolUseId: string,
  outcome: { content: string; isError: boolean }
): Promise<void> {
  if (!resultMessageId) return
  const { data: row } = await supabase.from('ai_messages').select('content').eq('id', resultMessageId).maybeSingle()
  if (!row || !Array.isArray(row.content)) return

  const patched = (row.content as ToolResultBlockLike[]).map((block) => {
    if (block.toolUseId !== toolUseId) return block
    const next: ToolResultBlockLike = { ...block, content: outcome.content }
    if (outcome.isError) next.isError = true
    else delete next.isError
    return next
  })

  await supabase.from('ai_messages').update({ content: patched }).eq('id', resultMessageId)
}
