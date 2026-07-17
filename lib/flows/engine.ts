import { createAdminClient } from '../supabase/admin'
import { getAdapter } from '../channels/registry'
import { matchesMessageTrigger, matchesCommentTrigger } from './matcher'
import { executeNode } from './nodes'
import { getContact, setContactFields } from '../contacts/service'
import type { ChannelAccountRef, Platform } from '../channels/types'
import type { FlowNode, FlowEdge, FlowRun, NodeExecContext } from './types'

interface DispatchAccount {
  id: string
  user_id: string
  access_token: string
}

interface AgentArgs {
  aiProvider: string | null
  aiApiKey: string | null
  aiModel: string | null
}

async function loadGraph(flowId: string): Promise<{ nodes: FlowNode[]; edges: FlowEdge[] }> {
  const supabase = createAdminClient()
  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from('flow_nodes').select('*').eq('flow_id', flowId),
    supabase.from('flow_edges').select('*').eq('flow_id', flowId),
  ])
  return { nodes: (nodes ?? []) as FlowNode[], edges: (edges ?? []) as FlowEdge[] }
}

function findEdgeTarget(edges: FlowEdge[], fromKey: string, handle: string): string | null {
  return edges.find((e) => e.source_node_key === fromKey && e.source_handle === handle)?.target_node_key ?? null
}

async function continueRun(
  run: FlowRun,
  platform: Platform,
  account: DispatchAccount,
  agentArgs: AgentArgs,
  startHandle: string = 'default'
): Promise<void> {
  const supabase = createAdminClient()
  const { nodes, edges } = await loadGraph(run.flow_id)
  const adapter = getAdapter(platform)
  const { data: dbAccount } = await supabase
    .from('channel_accounts')
    .select('page_id, phone_number_id, instagram_business_id')
    .eq('id', account.id)
    .single()

  const externalId = (platform === 'whatsapp'
    ? dbAccount?.phone_number_id
    : dbAccount?.instagram_business_id || dbAccount?.page_id) || ''

  console.log(`[flows:continueRun] Resolved externalId="${externalId}" for account=${account.id} platform=${platform}`, {
    page_id: dbAccount?.page_id,
    instagram_business_id: dbAccount?.instagram_business_id,
    phone_number_id: dbAccount?.phone_number_id,
  })

  if (!externalId) {
    console.error(`[flows:continueRun] ❌ externalId is EMPTY for account=${account.id} — messages will fail!`)
  }

  const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: account.access_token }
  const ctx: NodeExecContext = { account, ref, adapter, run, agentArgs }

  // The node at current_node_key has already "fired" — either it's the
  // trigger (no side effect) on a fresh run, or a delay node whose wait
  // has now elapsed on resume. Either way, advance past it once before
  // executing anything new.
  let currentKey = run.current_node_key ? findEdgeTarget(edges, run.current_node_key, startHandle) : null

  while (currentKey) {
    const node = nodes.find((n) => n.node_key === currentKey)
    if (!node) break

    // Best-effort funnel log — never blocks node execution on failure.
    supabase
      .from('flow_node_events')
      .insert({ flow_id: run.flow_id, channel_account_id: account.id, node_key: currentKey })
      .then(() => {})

    let result
    try {
      result = await executeNode(node, ctx)
    } catch (err) {
      console.error(`[flows:continueRun] Node ${currentKey} threw:`, err)
      await supabase.from('flow_runs').update({ status: 'failed', current_node_key: currentKey }).eq('id', run.id)
      return
    }

    if (result.type === 'wait') {
      const resumeAt = new Date(Date.now() + result.seconds * 1000).toISOString()
      await supabase.from('flow_runs').update({ status: 'waiting', current_node_key: currentKey, resume_at: resumeAt }).eq('id', run.id)
      return
    }
    if (result.type === 'pause') {
      // Waits indefinitely for an external event (button click) — resume_at
      // stays null so the delay cron (which filters .lte('resume_at', now))
      // never picks this run up; only continueRunFromPostback can advance it.
      await supabase.from('flow_runs').update({ status: 'waiting', current_node_key: currentKey, resume_at: null }).eq('id', run.id)
      return
    }
    if (result.type === 'stop') {
      await supabase.from('flow_runs').update({ status: 'completed', current_node_key: currentKey }).eq('id', run.id)
      return
    }

    const nextKey = findEdgeTarget(edges, currentKey, result.handle)
    if (!nextKey) {
      await supabase.from('flow_runs').update({ status: 'completed', current_node_key: currentKey }).eq('id', run.id)
      return
    }
    currentKey = nextKey
  }

  await supabase.from('flow_runs').update({ status: 'completed' }).eq('id', run.id)
}

async function startRun(
  flowId: string,
  platform: Platform,
  account: DispatchAccount,
  contactId: string | null,
  senderId: string,
  agentArgs: AgentArgs
): Promise<void> {
  const supabase = createAdminClient()
  const { nodes } = await loadGraph(flowId)
  const triggerNode = nodes.find((n) => n.type === 'trigger')
  if (!triggerNode) return

  const { data: run, error } = await supabase
    .from('flow_runs')
    .insert({
      flow_id: flowId,
      channel_account_id: account.id,
      contact_id: contactId,
      sender_id: senderId,
      current_node_key: triggerNode.node_key,
      status: 'active',
    })
    .select()
    .single()

  if (error || !run) {
    console.error('[flows:startRun] Failed to create flow_run:', error)
    return
  }

  supabase
    .from('flow_node_events')
    .insert({ flow_id: flowId, channel_account_id: account.id, node_key: triggerNode.node_key })
    .then(() => {})

  await continueRun(run as FlowRun, platform, account, agentArgs)
}

/** Called from dispatchInboundMessage — Scenario 0, gated by agent_settings.flows_enabled. */
export async function runFlowsForInbound(input: {
  platform: Platform
  account: DispatchAccount
  contactId: string | null
  senderId: string
  messageText: string
  storyEventType?: 'reply' | 'mention'
  agentArgs: AgentArgs
}): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: flows } = await supabase
    .from('flows')
    .select('id, trigger_type, trigger_keywords')
    .eq('channel_account_id', input.account.id)
    .eq('status', 'active')
    .order('priority', { ascending: false })

  const matched = (flows ?? []).find((f) => matchesMessageTrigger(f, input.messageText, input.storyEventType))
  if (!matched) return false

  await startRun(matched.id, input.platform, input.account, input.contactId, input.senderId, input.agentArgs)
  return true
}

/** Called from dispatchInboundComment — same gating, comment-shaped triggers. */
export async function runFlowsForInboundComment(input: {
  platform: Platform
  account: DispatchAccount
  contactId: string | null
  senderId: string
  commentText: string
  mediaId?: string | null
  agentArgs: AgentArgs
}): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: flows } = await supabase
    .from('flows')
    .select('id, trigger_type, trigger_keywords, target_post_ids')
    .eq('channel_account_id', input.account.id)
    .eq('status', 'active')
    .order('priority', { ascending: false })

  const matched = (flows ?? []).find((f) => matchesCommentTrigger(f, input.commentText, input.mediaId))
  if (!matched) return false

  await startRun(matched.id, input.platform, input.account, input.contactId, input.senderId, input.agentArgs)
  return true
}

/**
 * Called from dispatchInboundMessage when the inbound event carries a
 * growth-link referral ref matching a flow directly — bypasses trigger
 * matching entirely (the link IS the trigger).
 */
export async function startRunFromGrowthLink(
  flowId: string,
  platform: Platform,
  account: DispatchAccount,
  contactId: string | null,
  senderId: string,
  agentArgs: AgentArgs
): Promise<void> {
  await startRun(flowId, platform, account, contactId, senderId, agentArgs)
}

/**
 * Called from dispatchInboundMessage when an inbound event carries a
 * postback payload (`${flowId}:${nodeKey}:${buttonIndex}`, set by
 * lib/flows/nodes.ts when sending a send_message node with postback
 * buttons). Finds the run paused at that exact node for that sender and
 * advances it via the matching `btn-{index}` edge, instead of re-running
 * trigger matching from scratch. Returns false if no matching paused run
 * is found (payload stale, run already completed/cancelled, etc).
 */
export async function continueRunFromPostback(
  payload: string,
  platform: Platform,
  account: DispatchAccount,
  senderId: string,
  agentArgs: AgentArgs
): Promise<boolean> {
  const [flowId, nodeKey, buttonIndexStr] = payload.split(':')
  const buttonIndex = Number(buttonIndexStr)
  if (!flowId || !nodeKey || Number.isNaN(buttonIndex)) return false

  const supabase = createAdminClient()
  const { data: run } = await supabase
    .from('flow_runs')
    .select('*')
    .eq('flow_id', flowId)
    .eq('channel_account_id', account.id)
    .eq('sender_id', senderId)
    .eq('current_node_key', nodeKey)
    .in('status', ['active', 'waiting'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!run) return false

  await supabase.from('flow_runs').update({ status: 'active' }).eq('id', run.id)
  await continueRun(run as FlowRun, platform, account, agentArgs, `btn-${buttonIndex}`)
  return true
}

/**
 * Called from dispatchInboundMessage for a plain text message, before any
 * trigger matching: if this sender has a run paused at a `capture_input`
 * node, store the text as the reply instead of treating it as a fresh
 * trigger. Returns false (no-op) if there's no such paused run, so the
 * caller can fall through to normal trigger/Q&A/rules handling.
 */
export async function tryContinueRunFromTextCapture(
  text: string,
  platform: Platform,
  account: DispatchAccount,
  senderId: string,
  agentArgs: AgentArgs
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: run } = await supabase
    .from('flow_runs')
    .select('*')
    .eq('channel_account_id', account.id)
    .eq('sender_id', senderId)
    .in('status', ['active', 'waiting'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!run || !run.current_node_key) return false

  const { data: node } = await supabase
    .from('flow_nodes')
    .select('*')
    .eq('flow_id', run.flow_id)
    .eq('node_key', run.current_node_key)
    .maybeSingle()

  if (!node || node.type !== 'capture_input') return false

  const variableName = (node.config as Record<string, unknown> | null)?.variable_name as string | undefined
  const saveToCustomField = !!(node.config as Record<string, unknown> | null)?.save_to_custom_field

  let nextContext = run.context as Record<string, unknown>
  if (variableName) {
    nextContext = { ...nextContext, [variableName]: text }
    await supabase.from('flow_runs').update({ context: nextContext }).eq('id', run.id)

    if (saveToCustomField && run.contact_id) {
      const contact = await getContact(account.id, run.contact_id)
      await setContactFields(account.id, run.contact_id, {
        custom_fields: { ...(contact?.custom_fields ?? {}), [variableName]: text },
      })
    }
  }

  await supabase.from('flow_runs').update({ status: 'active' }).eq('id', run.id)
  await continueRun({ ...(run as FlowRun), context: nextContext }, platform, account, agentArgs, 'default')
  return true
}

/** Cron entry point — claims a waiting run optimistically before resuming it. */
export async function resumeRun(runId: string, platform: Platform, account: DispatchAccount, agentArgs: AgentArgs): Promise<void> {
  const supabase = createAdminClient()

  // Optimistic claim: only proceed if this run is still 'waiting' — guards
  // against two overlapping cron invocations resuming the same run twice.
  const { data: claimed } = await supabase
    .from('flow_runs')
    .update({ status: 'active' })
    .eq('id', runId)
    .eq('status', 'waiting')
    .select()
    .maybeSingle()

  if (!claimed) return
  await continueRun(claimed as FlowRun, platform, account, agentArgs)
}
