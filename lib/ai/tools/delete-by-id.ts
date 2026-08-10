import type { AiTool } from './types.ts'

interface DeleteByIdConfig {
  name: string
  description: string
  table: string
  /** Property name the model supplies the id under, e.g. 'campaignId'. */
  idField: string
  /** Key name in the returned object, e.g. 'deleted' or 'removed'. */
  resultKey: string
  notFoundMessage: string
}

/**
 * Factory for the ~230-line-duplicated family of single-row hard deletes
 * (delete_campaign, delete_product, delete_segment, delete_snippet,
 * delete_tag, delete_growth_link, delete_automation_rule,
 * remove_team_member). Centralizing them fixes two bugs that existed in
 * every copy:
 *
 * - risk was 'write_reversible' despite being an unrecoverable hard DELETE
 *   with no soft-delete column — the same "irreversible in the real world"
 *   reasoning that made delete_contact write_live was never applied here.
 * - success was reported unconditionally (`{ deleted: true }`) even when
 *   zero rows matched (wrong/hallucinated id, or an RLS-blocked cross-tenant
 *   id) — the model would confidently report a delete that never happened.
 */
export function deleteByIdTool(config: DeleteByIdConfig): AiTool<Record<string, unknown>, Record<string, boolean>> {
  return {
    name: config.name,
    description: config.description,
    // write_live, not write_reversible: no undo path exists for any of these tables.
    risk: 'write_live',
    inputSchema: {
      type: 'object',
      properties: { [config.idField]: { type: 'string' } },
      required: [config.idField],
      additionalProperties: false,
    },
    resourceRefs: (input) => [{ table: config.table, id: input[config.idField] as string }],
    run: async (input, ctx) => {
      const id = input[config.idField] as string
      const { data, error } = await ctx.supabase
        .from(config.table)
        .delete()
        .eq('id', id)
        .eq('channel_account_id', ctx.channelAccountId)
        .select('id')
      if (error) throw new Error(error.message)
      if (!data || data.length === 0) throw new Error(config.notFoundMessage)
      return { [config.resultKey]: true }
    },
  }
}
