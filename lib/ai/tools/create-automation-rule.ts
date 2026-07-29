import type { AiTool } from './types'

type TriggerType = 'any_message' | 'keyword' | 'story_reply' | 'any_comment' | 'comment_keyword'
type ReplyMethod = 'comment' | 'dm' | 'both'

interface Input {
  name: string
  triggerType?: TriggerType
  triggerKeywords?: string[]
  responseText: string
  replyMethod?: ReplyMethod
  responseTextDm?: string
}

/**
 * The simpler, single-action cousin of create_flow_draft: one trigger, one
 * text reply, no multi-step graph. Use this (not a flow) whenever the
 * request is just "reply X when someone says Y" — see the disambiguation
 * note in lib/ai/prompt.ts.
 */
export const createAutomationRuleTool: AiTool<Input, { ruleId: string }> = {
  name: 'create_automation_rule',
  description:
    "Crée une règle d'automatisation simple (mot-clé → réponse texte unique), pour un commentaire ou un message direct. Pour une automatisation à plusieurs étapes, utilise create_flow_draft à la place.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      triggerType: {
        type: 'string',
        enum: ['any_message', 'keyword', 'story_reply', 'any_comment', 'comment_keyword'],
        description: 'Par défaut any_message. keyword/comment_keyword nécessitent triggerKeywords.',
      },
      triggerKeywords: { type: 'array', items: { type: 'string' } },
      responseText: { type: 'string', description: 'Réponse envoyée (commentaire ou DM selon replyMethod).' },
      replyMethod: {
        type: 'string',
        enum: ['comment', 'dm', 'both'],
        description: "Pertinent seulement pour les déclencheurs commentaire. Défaut 'comment'.",
      },
      responseTextDm: { type: 'string', description: "Message DM distinct si replyMethod inclut 'dm'." },
    },
    required: ['name', 'responseText'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('automation_rules')
      .insert({
        channel_account_id: ctx.channelAccountId,
        name: input.name.trim().slice(0, 120),
        trigger_type: input.triggerType ?? 'any_message',
        trigger_keywords: input.triggerKeywords ?? null,
        response_text: input.responseText.trim(),
        reply_method: input.replyMethod ?? 'comment',
        response_text_dm: input.responseTextDm?.trim() || null,
        is_active: true,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création de la règle impossible')
    return { ruleId: data.id }
  },
}
