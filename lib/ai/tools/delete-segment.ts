import type { AiTool } from './types'

interface Input {
  segmentId: string
}

export const deleteSegmentTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_segment',
  description: 'Supprime un segment de contacts.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { segmentId: { type: 'string' } },
    required: ['segmentId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'segments', id: input.segmentId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('segments')
      .delete()
      .eq('id', input.segmentId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
