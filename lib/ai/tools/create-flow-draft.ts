import type { AiTool } from './types.ts'

type TriggerType = 'any_message' | 'keyword' | 'story_reply' | 'story_mention' | 'any_comment' | 'comment_keyword'

interface Input {
  name: string
  trigger_type?: TriggerType
  trigger_keywords?: string[]
}

export const createFlowDraftTool: AiTool<Input, { flowId: string }> = {
  name: 'create_flow_draft',
  description: 'Crée un nouveau flow en brouillon avec le type de déclencheur approprié selon l\'analyse de la demande. Analyse le contexte pour choisir entre any_message (par défaut), keyword, story_reply, story_mention, any_comment, ou comment_keyword. Si keyword ou comment_keyword, fournis trigger_keywords. Réversible : reste invisible tant qu\'il n\'est pas activé.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nom du flow' },
      trigger_type: {
        type: 'string',
        enum: ['any_message', 'keyword', 'story_reply', 'story_mention', 'any_comment', 'comment_keyword'],
        description: 'Type de déclencheur. Par défaut: any_message. Utilise keyword/comment_keyword si des mots-clés sont mentionnés, story_reply/story_mention pour les stories, any_comment/comment_keyword pour les commentaires.',
      },
      trigger_keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Mots-clés à détecter. REQUIS si trigger_type est "keyword" ou "comment_keyword". Les mots doivent être en minuscules.',
      },
    },
    required: ['name'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const name = input.name.trim().slice(0, 120) || 'Nouveau flow'
    const triggerType = input.trigger_type || 'any_message'
    const triggerKeywords = input.trigger_keywords?.map((kw) => kw.toLowerCase().trim()).filter(Boolean) || null

    // Validation: keyword and comment_keyword triggers MUST have keywords
    if ((triggerType === 'keyword' || triggerType === 'comment_keyword') && (!triggerKeywords || triggerKeywords.length === 0)) {
      throw new Error(`Le déclencheur "${triggerType}" nécessite au moins un mot-clé dans trigger_keywords`)
    }

    const { data: flow, error } = await ctx.supabase
      .from('flows')
      .insert({
        channel_account_id: ctx.channelAccountId,
        name,
        status: 'draft',
        trigger_type: triggerType,
        trigger_keywords: triggerKeywords,
      })
      .select('id')
      .single()
    if (error || !flow) throw new Error(error?.message ?? 'Création du flow impossible')

    await ctx.supabase.from('flow_nodes').insert({
      flow_id: flow.id,
      channel_account_id: ctx.channelAccountId,
      node_key: 'trigger',
      type: 'trigger',
      config: {},
      position: { x: 0, y: 0 },
    })

    return { flowId: flow.id }
  },
}
