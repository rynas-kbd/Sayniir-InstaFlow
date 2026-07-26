import type { SupabaseClient } from '@supabase/supabase-js'
import type { FlowNode, FlowEdge } from '../../flows/types'
import { computeFlowFindings } from '../lint/compute'
import { buildFlowDigest } from './flow-digest'
import type { AiContext } from './types'

// ~4 chars/token heuristic. The hard cap from docs/AI_NATIVE_DESIGN.md §8.5 is 2000 tokens for
// the page context block; approximated here as a single character cap rather than a tokenizer
// call, which would cost a request of its own for a budget check.
const MAX_CONTEXT_CHARS = 2000 * 4

function truncate(text: string): string {
  return text.length > MAX_CONTEXT_CHARS ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n[…tronqué]` : text
}

/**
 * Resolves an AiContext key into the text block injected into the conversation. Ownership is
 * enforced implicitly: `supabase` must be the caller's RLS-scoped client (never the admin
 * client), so a flowId/contactId the user doesn't own resolves to nothing rather than leaking
 * cross-tenant data. See docs/AI_NATIVE_DESIGN.md §1.3, §8.5.
 */
export async function resolveAiContext(
  supabase: SupabaseClient,
  channelAccountId: string,
  context: AiContext
): Promise<string> {
  switch (context.kind) {
    case 'none':
      return await resolveNoneContext(supabase, channelAccountId)
    case 'flow':
      return await resolveFlowContext(supabase, channelAccountId, context.flowId)
    case 'inbox':
      return await resolveInboxContext(supabase, channelAccountId, context.contactId)
    case 'contacts':
      return await resolveContactsContext(supabase, channelAccountId)
    case 'campaigns':
      return await resolveCampaignsContext(supabase, channelAccountId)
    case 'dashboard':
    case 'analytics':
    case 'automation':
    case 'boutique':
    case 'settings':
      // Not yet implemented — falls back to the account summary rather than an empty block.
      return await resolveNoneContext(supabase, channelAccountId)
    default:
      return ''
  }
}

async function resolveNoneContext(supabase: SupabaseClient, channelAccountId: string): Promise<string> {
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('platform, page_name, instagram_username')
    .eq('id', channelAccountId)
    .single()
  if (!account) return ''
  return `ACCOUNT platform=${account.platform} name=${account.page_name ?? account.instagram_username ?? ''}`
}

async function resolveFlowContext(supabase: SupabaseClient, channelAccountId: string, flowId: string): Promise<string> {
  const { data: flow } = await supabase.from('flows').select('*').eq('id', flowId).eq('channel_account_id', channelAccountId).single()
  if (!flow) return ''

  const [{ data: nodes }, { data: edges }, { count: runCount }, { data: events }, { data: agentSettings }] = await Promise.all([
    supabase.from('flow_nodes').select('*').eq('flow_id', flowId),
    supabase.from('flow_edges').select('*').eq('flow_id', flowId),
    supabase.from('flow_runs').select('*', { count: 'exact', head: true }).eq('flow_id', flowId),
    supabase.from('flow_node_events').select('node_key').eq('flow_id', flowId),
    supabase.from('agent_settings').select('flows_enabled, ai_api_key').eq('channel_account_id', channelAccountId).maybeSingle(),
  ])

  const reachByNodeKey: Record<string, number> = {}
  for (const event of events ?? []) {
    reachByNodeKey[event.node_key] = (reachByNodeKey[event.node_key] ?? 0) + 1
  }

  const findings = computeFlowFindings({
    flow,
    nodes: (nodes ?? []) as FlowNode[],
    edges: (edges ?? []) as FlowEdge[],
    flowsEnabled: agentSettings?.flows_enabled ?? false,
    aiKeyResolved: Boolean(agentSettings?.ai_api_key) || Boolean(process.env.GEMINI_API_KEY),
    runCount: runCount ?? 0,
    reachByNodeKey,
  })

  const digest = buildFlowDigest(flow, (nodes ?? []) as FlowNode[], (edges ?? []) as FlowEdge[], runCount ?? 0, reachByNodeKey, findings)
  return truncate(digest)
}

async function resolveInboxContext(supabase: SupabaseClient, channelAccountId: string, contactId: string): Promise<string> {
  const { data: contact } = await supabase
    .from('contacts')
    .select('full_name, username, is_subscribed, bot_paused, last_inbound_at, custom_fields')
    .eq('id', contactId)
    .eq('channel_account_id', channelAccountId)
    .single()
  if (!contact) return ''

  const { data: messages } = await supabase
    .from('message_logs')
    .select('direction, message_text, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(12)

  const lines = (messages ?? [])
    .reverse()
    .map((m) => `${m.direction === 'incoming' ? 'contact' : 'bot'}: ${String(m.message_text ?? '').slice(0, 200)}`)

  const header = `CONTACT ${contact.full_name ?? contact.username ?? contactId} subscribed=${contact.is_subscribed} bot_paused=${contact.bot_paused}`
  return truncate([header, '<untrusted_data>', ...lines, '</untrusted_data>'].join('\n'))
}

async function resolveContactsContext(supabase: SupabaseClient, channelAccountId: string): Promise<string> {
  const [{ count: total }, { data: taggedRows }] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('channel_account_id', channelAccountId),
    supabase.from('contact_tags').select('contact_id').eq('channel_account_id', channelAccountId),
  ])
  const tagged = new Set((taggedRows ?? []).map((r) => r.contact_id)).size
  return `CONTACTS total=${total ?? 0} tagged=${tagged}`
}

async function resolveCampaignsContext(supabase: SupabaseClient, channelAccountId: string): Promise<string> {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status')
    .eq('channel_account_id', channelAccountId)
    .order('created_at', { ascending: false })
    .limit(10)
  const lines = (campaigns ?? []).map((c) => `${c.id} "${c.name}" [${c.status}]`)
  return truncate(['CAMPAIGNS', ...lines].join('\n'))
}
