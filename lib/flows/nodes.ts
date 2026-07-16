import { createAdminClient } from '../supabase/admin'
import { callAgentLLM } from '../agent/engine'
import { addTag, removeTag, getContact } from '../contacts/service'
import type { FlowNode, NodeExecContext, NodeResult } from './types'
import type { ChannelButton } from '../channels/types'

interface CardButtonConfig {
  type?: 'postback' | 'web_url'
  title: string
  url?: string
}

async function evaluateCondition(node: FlowNode, ctx: NodeExecContext): Promise<'true' | 'false'> {
  const { field, operator, value } = node.config as { field?: string; operator?: string; value?: string }
  if (!field) return 'false'

  let actual: unknown
  if (field.startsWith('context.')) {
    actual = ctx.run.context[field.slice('context.'.length)]
  } else if (ctx.run.contact_id) {
    const contact = await getContact(ctx.account.id, ctx.run.contact_id)
    actual = field === 'tags' ? undefined : (contact as Record<string, unknown> | null)?.[field]
  }

  const matched =
    operator === 'exists'
      ? actual !== undefined && actual !== null && actual !== ''
      : operator === 'contains'
        ? typeof actual === 'string' && actual.toLowerCase().includes((value ?? '').toLowerCase())
        : String(actual ?? '') === (value ?? '')

  return matched ? 'true' : 'false'
}

export async function executeNode(node: FlowNode, ctx: NodeExecContext): Promise<NodeResult> {
  switch (node.type) {
    case 'send_message': {
      const messageType = node.config.message_type as string | undefined
      if (messageType === 'card') {
        const title = (node.config.card_title as string) || ''
        const subtitle = (node.config.card_subtitle as string) || undefined
        const imageUrl = (node.config.card_image_url as string) || undefined
        const buttons = (node.config.card_buttons as CardButtonConfig[]) || []
        // Button Template (no image) attempts a real tappable button on
        // Instagram; Generic Template (with image) is known to fail there
        // and always falls back to text. Prefer the real-button path
        // whenever there's no image to carry, for both link and action buttons.
        const useButtonTemplate = buttons.length > 0 && !imageUrl

        if (useButtonTemplate && ctx.adapter.sendButtons) {
          const channelButtons: ChannelButton[] = buttons.map((b, idx) =>
            b.type === 'postback'
              ? { type: 'postback', title: b.title, payload: `${node.flow_id}:${node.node_key}:${idx}` }
              : { type: 'web_url', title: b.title, url: b.url }
          )
          await ctx.adapter.sendButtons(ctx.ref, ctx.run.sender_id, title || subtitle || '', channelButtons)
          // Pause here: the run only advances again once a button is
          // clicked (postback), handled separately in continueRunFromPostback.
          return { type: 'pause' }
        } else if (title && ctx.adapter.sendCard) {
          await ctx.adapter.sendCard(
            ctx.ref,
            ctx.run.sender_id,
            title,
            subtitle,
            imageUrl,
            buttons.map((b) => ({ title: b.title, url: b.url ?? '' }))
          )
        }
      } else {
        const text = (node.config.text as string) || ''
        if (text) await ctx.adapter.sendMessage(ctx.ref, ctx.run.sender_id, text)
      }
      return { type: 'continue', handle: 'default' }
    }

    case 'ai_reply': {
      const instructions = (node.config.instructions as string) || 'Réponds de façon utile et concise.'
      try {
        const result = await callAgentLLM<{ reply: string }>(
          `${instructions}\n\nRéponds STRICTEMENT au format JSON: {"reply": "..."}`,
          ctx.agentArgs.aiProvider,
          ctx.agentArgs.aiApiKey,
          ctx.agentArgs.aiModel
        )
        if (result?.reply) await ctx.adapter.sendMessage(ctx.ref, ctx.run.sender_id, result.reply)
      } catch (err) {
        console.error('[flows:ai_reply] LLM call failed:', err)
      }
      return { type: 'continue', handle: 'default' }
    }

    case 'condition': {
      const handle = await evaluateCondition(node, ctx)
      return { type: 'continue', handle }
    }

    case 'delay': {
      const seconds = Number(node.config.seconds) || 60
      return { type: 'wait', seconds }
    }

    case 'set_tag':
    case 'remove_tag': {
      const tagId = node.config.tag_id as string | undefined
      if (tagId && ctx.run.contact_id) {
        if (node.type === 'set_tag') await addTag(ctx.account.id, ctx.run.contact_id, tagId)
        else await removeTag(ctx.run.contact_id, tagId)
      }
      return { type: 'continue', handle: 'default' }
    }

    case 'jump': {
      const targetFlowId = node.config.target_flow_id as string | undefined
      if (targetFlowId) {
        const supabase = createAdminClient()
        await supabase.from('flow_runs').insert({
          flow_id: targetFlowId,
          channel_account_id: ctx.account.id,
          contact_id: ctx.run.contact_id,
          sender_id: ctx.run.sender_id,
          status: 'active',
        })
      }
      return { type: 'stop' }
    }

    default:
      return { type: 'stop' }
  }
}
