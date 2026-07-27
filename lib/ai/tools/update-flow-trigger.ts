import type { AiTool, ResourceRef } from './types'

type TriggerType = 'any_message' | 'keyword' | 'story_reply' | 'story_mention' | 'any_comment' | 'comment_keyword'

interface Input {
  flowId: string
  trigger_type: TriggerType
  trigger_keywords?: string[]
}

export const updateFlowTriggerTool: AiTool<Input, { success: boolean }> = {
  name: 'update_flow_trigger',
  description: 'Met à jour le type de déclencheur d\'un flow existant. Permet de changer un flow de any_message vers keyword, ou d\'ajuster les mots-clés d\'un déclencheur existant. Réversible : l\'utilisateur peut toujours modifier via l\'interface.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      flowId: { type: 'string', description: 'ID du flow à modifier' },
      trigger_type: {
        type: 'string',
        enum: ['any_message', 'keyword', 'story_reply', 'story_mention', 'any_comment', 'comment_keyword'],
        description: 'Nouveau type de déclencheur',
      },
      trigger_keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Mots-clés à détecter. REQUIS si trigger_type est "keyword" ou "comment_keyword".',
      },
    },
    required: ['flowId', 'trigger_type'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'flows', id: input.flowId }],
  run: async (input, ctx) => {
    const triggerType = input.trigger_type
    const triggerKeywords = input.trigger_keywords?.map((kw) => kw.toLowerCase().trim()).filter(Boolean) || null

    // Validation: keyword and comment_keyword triggers MUST have keywords
    if ((triggerType === 'keyword' || triggerType === 'comment_keyword') && (!triggerKeywords || triggerKeywords.length === 0)) {
      throw new Error(`Le déclencheur "${triggerType}" nécessite au moins un mot-clé dans trigger_keywords`)
    }

    // Clear keywords for non-keyword trigger types
    const finalKeywords = (triggerType === 'keyword' || triggerType === 'comment_keyword') ? triggerKeywords : null

    const { error } = await ctx.supabase
      .from('flows')
      .update({
        trigger_type: triggerType,
        trigger_keywords: finalKeywords,
      })
      .eq('id', input.flowId)
      .eq('channel_account_id', ctx.channelAccountId)

    if (error) throw new Error(error.message ?? 'Mise à jour du déclencheur impossible')

    return { success: true }
  },
}
