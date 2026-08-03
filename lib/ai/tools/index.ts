import { listFlowsTool } from './list-flows'
import { getFlowDigestTool } from './get-flow-digest'
import { getLintFindingsTool } from './get-lint-findings'
import { searchContactsTool } from './search-contacts'
import { getAnalyticsSummaryTool } from './get-analytics-summary'
import { createFlowDraftTool } from './create-flow-draft'
import { addFlowNodeTool } from './add-flow-node'
import { connectFlowNodesTool } from './connect-flow-nodes'
import { createTagTool } from './create-tag'
import { tagContactTool } from './tag-contact'
import { untagContactTool } from './untag-contact'
import { createSegmentTool } from './create-segment'
import { createSnippetTool } from './create-snippet'
import { writeMemoryTool } from './write-memory'
import { setFlowStatusTool } from './set-flow-status'
import { scheduleCampaignTool } from './schedule-campaign'
import { setContactBotPausedTool } from './set-contact-bot-paused'
import { updateAgentSettingsTool } from './update-agent-settings'
import { deleteFlowNodeTool } from './delete-flow-node'
import { listProductsTool } from './list-products'
import { createProductTool } from './create-product'
import { updateProductTool } from './update-product'
import { listOrdersTool } from './list-orders'
import { updateOrderStatusTool } from './update-order-status'
import { updateFlowTriggerTool } from './update-flow-trigger'
import { listAutomationRulesTool } from './list-automation-rules'
import { createAutomationRuleTool } from './create-automation-rule'
import { updateAutomationRuleTool } from './update-automation-rule'
import { deleteAutomationRuleTool } from './delete-automation-rule'
import { setAutomationRuleActiveTool } from './set-automation-rule-active'
import { listCampaignsTool } from './list-campaigns'
import { cancelCampaignTool } from './cancel-campaign'
import { deleteCampaignTool } from './delete-campaign'
import { listContactsTool } from './list-contacts'
import { updateContactTool } from './update-contact'
import { deleteContactTool } from './delete-contact'
import { listTeamMembersTool } from './list-team-members'
import { inviteTeamMemberTool } from './invite-team-member'
import { removeTeamMemberTool } from './remove-team-member'
import { listGrowthLinksTool } from './list-growth-links'
import { createGrowthLinkTool } from './create-growth-link'
import { deleteGrowthLinkTool } from './delete-growth-link'
import { listSnippetsTool } from './list-snippets'
import { updateSnippetTool } from './update-snippet'
import { deleteSnippetTool } from './delete-snippet'
import { listSegmentsTool } from './list-segments'
import { deleteSegmentTool } from './delete-segment'
import { listTagsTool } from './list-tags'
import { deleteTagTool } from './delete-tag'
import { deleteProductTool } from './delete-product'
import { sendMessageToContactTool } from './send-message-to-contact'
import type { AiTool } from './types'

// Sorted by name and kept in this stable order across turns — the tool block is the first
// thing in the prompt and carries the prompt-cache breakpoint (§8.6); reordering it defeats
// the cache silently.
export const AI_TOOLS: AiTool<never, unknown>[] = (
  [
    listFlowsTool,
    getFlowDigestTool,
    getLintFindingsTool,
    searchContactsTool,
    getAnalyticsSummaryTool,
    createFlowDraftTool,
    addFlowNodeTool,
    connectFlowNodesTool,
    createTagTool,
    tagContactTool,
    untagContactTool,
    createSegmentTool,
    createSnippetTool,
    writeMemoryTool,
    setFlowStatusTool,
    scheduleCampaignTool,
    setContactBotPausedTool,
    updateAgentSettingsTool,
    deleteFlowNodeTool,
    updateFlowTriggerTool,
    listProductsTool,
    createProductTool,
    updateProductTool,
    listOrdersTool,
    updateOrderStatusTool,
    listAutomationRulesTool,
    createAutomationRuleTool,
    updateAutomationRuleTool,
    deleteAutomationRuleTool,
    setAutomationRuleActiveTool,
    listCampaignsTool,
    cancelCampaignTool,
    deleteCampaignTool,
    listContactsTool,
    updateContactTool,
    deleteContactTool,
    listTeamMembersTool,
    inviteTeamMemberTool,
    removeTeamMemberTool,
    listGrowthLinksTool,
    createGrowthLinkTool,
    deleteGrowthLinkTool,
    listSnippetsTool,
    updateSnippetTool,
    deleteSnippetTool,
    listSegmentsTool,
    deleteSegmentTool,
    listTagsTool,
    deleteTagTool,
    deleteProductTool,
    sendMessageToContactTool,
  ] as AiTool<never, unknown>[]
).sort((a, b) => a.name.localeCompare(b.name))

export function getToolByName(name: string): AiTool<never, unknown> | undefined {
  return AI_TOOLS.find((tool) => tool.name === name)
}

export type { AiTool, ToolExecContext, ResourceRef, ToolRisk } from './types'
