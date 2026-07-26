import type { SupabaseClient } from '@supabase/supabase-js'

export type ToolRisk = 'read' | 'write_reversible' | 'write_live'

export interface ResourceRef {
  table: string
  id: string
}

export interface ToolExecContext {
  /** RLS-scoped, bound to the requesting user's session — a tool must never reach for the admin client. */
  supabase: SupabaseClient
  channelAccountId: string
  userId: string
}

export interface AiTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string
  description: string
  risk: ToolRisk
  /** Anthropic JSON Schema for the tool's input, used with strict:true. */
  inputSchema: Record<string, unknown>
  /**
   * Rows this call touches, declared rather than checked inline — the dispatcher
   * (lib/ai/tools/execute.ts) verifies every ref belongs to the account before run() is
   * called, so an author can't forget the check because they never write it themselves.
   */
  resourceRefs?: (input: TInput) => ResourceRef[]
  run: (input: TInput, ctx: ToolExecContext) => Promise<TOutput>
}
