import { createAdminClient } from '../../supabase/admin'
import { resolveAudience, resolveSegment } from '../../contacts/service'
import type { FlowNode, FlowEdge } from '../../flows/types'
import type { LintFinding } from './types'
import { computeFlowFindings, computeCampaignAudienceFindings } from './compute'
import { checkAccountTokenExpiring, checkAccountNoFallback, checkCampaignFailedSends, checkContactsUntagged } from './rules'

/** Upserts findings for an account, preserving dismissed_at/explanation on rows that still apply, and removing rows that no longer do. */
async function upsertFindings(channelAccountId: string, findings: LintFinding[]): Promise<void> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('ai_insights')
    .select('id, rule_id, subject_id')
    .eq('channel_account_id', channelAccountId)

  const currentKeys = new Set(findings.map((f) => `${f.ruleId}::${f.subjectId}`))
  const staleIds = (existing ?? [])
    .filter((row) => !currentKeys.has(`${row.rule_id}::${row.subject_id}`))
    .map((row) => row.id)

  if (staleIds.length > 0) {
    await supabase.from('ai_insights').delete().in('id', staleIds)
  }

  if (findings.length > 0) {
    await supabase.from('ai_insights').upsert(
      findings.map((f) => ({
        channel_account_id: channelAccountId,
        rule_id: f.ruleId,
        scope: f.scope,
        subject_id: f.subjectId,
        severity: f.severity,
        title: f.title,
        detail: f.detail ?? null,
        fix_tool_name: f.fixToolName ?? null,
        fix_tool_input: f.fixToolInput ?? null,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'channel_account_id,rule_id,subject_id' }
    )
  }
}

/** Recomputes every deterministic lint finding for one account. Called from the flow-runs cron and on-demand refresh routes. */
export async function refreshAccountFindings(channelAccountId: string): Promise<void> {
  const supabase = createAdminClient()

  const [{ data: account }, { data: agentSettings }, { data: flows }, { data: campaigns }, { data: contacts }, { data: taggedRows }] =
    await Promise.all([
      supabase.from('channel_accounts').select('id, token_expires_at').eq('id', channelAccountId).single(),
      supabase
        .from('agent_settings')
        .select('flows_enabled, default_message_enabled, ai_api_key')
        .eq('channel_account_id', channelAccountId)
        .maybeSingle(),
      supabase.from('flows').select('id, status, trigger_type, created_at').eq('channel_account_id', channelAccountId),
      supabase.from('campaigns').select('id, status, segment_id, audience_tag_ids').eq('channel_account_id', channelAccountId),
      supabase.from('contacts').select('id').eq('channel_account_id', channelAccountId),
      supabase.from('contact_tags').select('contact_id').eq('channel_account_id', channelAccountId),
    ])

  if (!account) return

  const findings: LintFinding[] = []
  const flowsEnabled = agentSettings?.flows_enabled ?? false
  const aiKeyResolved = Boolean(agentSettings?.ai_api_key) || Boolean(process.env.GEMINI_API_KEY)

  for (const flow of flows ?? []) {
    const [{ data: nodes }, { data: edges }, { count: runCount }, { data: events }] = await Promise.all([
      supabase.from('flow_nodes').select('*').eq('flow_id', flow.id),
      supabase.from('flow_edges').select('*').eq('flow_id', flow.id),
      supabase.from('flow_runs').select('*', { count: 'exact', head: true }).eq('flow_id', flow.id),
      supabase.from('flow_node_events').select('node_key').eq('flow_id', flow.id),
    ])

    const reachByNodeKey: Record<string, number> = {}
    for (const event of events ?? []) {
      reachByNodeKey[event.node_key] = (reachByNodeKey[event.node_key] ?? 0) + 1
    }

    findings.push(
      ...computeFlowFindings({
        flow,
        nodes: (nodes ?? []) as FlowNode[],
        edges: (edges ?? []) as FlowEdge[],
        flowsEnabled,
        aiKeyResolved,
        runCount: runCount ?? 0,
        reachByNodeKey,
      })
    )
  }

  const hasGenericFlow = (flows ?? []).some((f) => f.status === 'active' && f.trigger_type === 'any_message')
  const { count: activeRuleCount } = await supabase
    .from('automation_rules')
    .select('*', { count: 'exact', head: true })
    .eq('channel_account_id', channelAccountId)
    .eq('is_active', true)
  const activeAutomationCount = (flows ?? []).filter((f) => f.status === 'active').length + (activeRuleCount ?? 0)

  findings.push(...checkAccountTokenExpiring(account, activeAutomationCount))
  findings.push(...checkAccountNoFallback(account, agentSettings?.default_message_enabled ?? true, hasGenericFlow))

  for (const campaign of campaigns ?? []) {
    if (campaign.status === 'scheduled') {
      const contactIds = campaign.segment_id
        ? await resolveSegment(channelAccountId, campaign.segment_id)
        : await resolveAudience(channelAccountId, campaign.audience_tag_ids ?? [])
      if (contactIds.length > 0) {
        const { data: audience } = await supabase
          .from('contacts')
          .select('is_subscribed, last_inbound_at')
          .in('id', contactIds)
        findings.push(...computeCampaignAudienceFindings(campaign, audience ?? []))
      }
    }

    if (campaign.status === 'sent' || campaign.status === 'failed') {
      const { count: sentCount } = await supabase
        .from('campaign_sends')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent')
      const { count: failedCount } = await supabase
        .from('campaign_sends')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'failed')
      findings.push(...checkCampaignFailedSends(campaign, sentCount ?? 0, failedCount ?? 0))
    }
  }

  const taggedCount = new Set((taggedRows ?? []).map((r) => r.contact_id)).size
  findings.push(...checkContactsUntagged(account, (contacts ?? []).length, taggedCount))

  await upsertFindings(channelAccountId, findings)
}

/** Recomputes findings for every channel account — the nightly, zero-LLM half of the cron. */
export async function refreshAllAccountFindings(): Promise<void> {
  const supabase = createAdminClient()
  const { data: accounts } = await supabase.from('channel_accounts').select('id')
  for (const account of accounts ?? []) {
    await refreshAccountFindings(account.id)
  }
}
