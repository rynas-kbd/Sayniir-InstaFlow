import type { FlowNode, FlowEdge } from '../../flows/types'
import type { LintFinding } from './types'
import {
  checkFlowUnreachable,
  checkFlowDanglingHandle,
  checkFlowDelayExceedsCron,
  checkFlowNotEnabled,
  checkFlowAiReplyNoKey,
  checkFlowNoRuns,
  checkFlowDropoff,
  checkCampaignWindow24h,
  checkCampaignUnsubscribed,
  type CampaignAudienceContact,
} from './rules'

export interface FlowLintInput {
  flow: { id: string; status: string; created_at: string }
  nodes: FlowNode[]
  edges: FlowEdge[]
  flowsEnabled: boolean
  aiKeyResolved: boolean
  runCount: number
  reachByNodeKey: Record<string, number>
}

/** Runs all 7 flow-scoped rules against one flow's snapshot. Pure — no DB access. */
export function computeFlowFindings(input: FlowLintInput): LintFinding[] {
  const { flow, nodes, edges, flowsEnabled, aiKeyResolved, runCount, reachByNodeKey } = input
  return [
    ...checkFlowUnreachable(flow, nodes, edges),
    ...checkFlowDanglingHandle(flow, nodes, edges),
    ...checkFlowDelayExceedsCron(flow, nodes),
    ...checkFlowNotEnabled(flow, flowsEnabled),
    ...checkFlowAiReplyNoKey(flow, nodes, aiKeyResolved),
    ...checkFlowNoRuns(flow, runCount),
    ...checkFlowDropoff(flow, nodes, edges, reachByNodeKey),
  ]
}

/** Runs the pre-send compliance rules against a resolved campaign audience. Pure — no DB access. */
export function computeCampaignAudienceFindings(
  campaign: { id: string },
  audience: CampaignAudienceContact[]
): LintFinding[] {
  return [...checkCampaignWindow24h(campaign, audience), ...checkCampaignUnsubscribed(campaign, audience)]
}
