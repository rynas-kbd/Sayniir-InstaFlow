import type { AiTool } from './types'

interface ListByAccountConfig {
  name: string
  description: string
  table: string
  /** PostgREST select string, e.g. 'id, name, status'. */
  columns: string
  orderBy: { column: string; ascending: boolean }
  /** Key the rows are returned under, e.g. 'tags' for { tags: [...] }. */
  resultKey: string
}

/**
 * Factory for the ~8 identical account-scoped list tools (list_tags,
 * list_segments, list_snippets, list_campaigns, list_flows,
 * list_growth_links, list_team_members, list_automation_rules). Every copy
 * destructured only `{ data }` and returned `data ?? []` unconditionally —
 * on an RLS denial, timeout, or schema error the model received an empty
 * list indistinguishable from "you really have zero rows" and would
 * confidently tell the user so (or worse, create a duplicate). Centralizing
 * the query forces the error check in one place instead of trusting every
 * new list tool to remember it (list_products/list_orders already did this
 * right — this factory generalizes their pattern).
 */
export function listByAccountTool(config: ListByAccountConfig): AiTool<Record<string, never>, Record<string, unknown[]>> {
  return {
    name: config.name,
    description: config.description,
    risk: 'read',
    inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    run: async (_input, ctx) => {
      const { data, error } = await ctx.supabase
        .from(config.table)
        .select(config.columns)
        .eq('channel_account_id', ctx.channelAccountId)
        .order(config.orderBy.column, { ascending: config.orderBy.ascending })
      if (error) throw new Error(error.message)
      return { [config.resultKey]: data ?? [] }
    },
  }
}
