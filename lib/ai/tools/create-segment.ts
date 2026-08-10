import type { AiTool } from './types.ts'

interface Input {
  name: string
  tagIds?: string[]
  minDaysSinceLastInbound?: number
}

export const createSegmentTool: AiTool<Input, { segmentId: string }> = {
  name: 'create_segment',
  description: 'Crée un segment réutilisable de contacts (AND de tags, optionnellement filtré par inactivité).',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      tagIds: { type: 'array', items: { type: 'string' } },
      minDaysSinceLastInbound: { type: 'integer' },
    },
    required: ['name'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('segments')
      .insert({
        channel_account_id: ctx.channelAccountId,
        name: input.name.trim().slice(0, 120),
        tag_ids: input.tagIds ?? [],
        min_days_since_last_inbound: input.minDaysSinceLastInbound ?? null,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création du segment impossible')
    return { segmentId: data.id }
  },
}
