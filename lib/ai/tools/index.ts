import { listFlowsTool } from './list-flows.ts'
import { getFlowDigestTool } from './get-flow-digest.ts'
import { getLintFindingsTool } from './get-lint-findings.ts'
import { searchContactsTool } from './search-contacts.ts'
import { getAnalyticsSummaryTool } from './get-analytics-summary.ts'
import { createFlowDraftTool } from './create-flow-draft.ts'
import { addFlowNodeTool } from './add-flow-node.ts'
import { connectFlowNodesTool } from './connect-flow-nodes.ts'
import { createTagTool } from './create-tag.ts'
import { tagContactTool } from './tag-contact.ts'
import { untagContactTool } from './untag-contact.ts'
import { createSegmentTool } from './create-segment.ts'
import { createSnippetTool } from './create-snippet.ts'
import { writeMemoryTool } from './write-memory.ts'
import { setFlowStatusTool } from './set-flow-status.ts'
import { scheduleCampaignTool } from './schedule-campaign.ts'
import { setContactBotPausedTool } from './set-contact-bot-paused.ts'
import { updateAgentSettingsTool } from './update-agent-settings.ts'
import { deleteFlowNodeTool } from './delete-flow-node.ts'
import { listProductsTool } from './list-products.ts'
import { createProductTool } from './create-product.ts'
import { updateProductTool } from './update-product.ts'
import { listOrdersTool } from './list-orders.ts'
import { updateOrderStatusTool } from './update-order-status.ts'
import { updateFlowTriggerTool } from './update-flow-trigger.ts'
import { listAutomationRulesTool } from './list-automation-rules.ts'
import { createAutomationRuleTool } from './create-automation-rule.ts'
import { updateAutomationRuleTool } from './update-automation-rule.ts'
import { deleteAutomationRuleTool } from './delete-automation-rule.ts'
import { setAutomationRuleActiveTool } from './set-automation-rule-active.ts'
import { listCampaignsTool } from './list-campaigns.ts'
import { cancelCampaignTool } from './cancel-campaign.ts'
import { deleteCampaignTool } from './delete-campaign.ts'
import { listContactsTool } from './list-contacts.ts'
import { updateContactTool } from './update-contact.ts'
import { deleteContactTool } from './delete-contact.ts'
import { listTeamMembersTool } from './list-team-members.ts'
import { inviteTeamMemberTool } from './invite-team-member.ts'
import { removeTeamMemberTool } from './remove-team-member.ts'
import { listGrowthLinksTool } from './list-growth-links.ts'
import { createGrowthLinkTool } from './create-growth-link.ts'
import { deleteGrowthLinkTool } from './delete-growth-link.ts'
import { listSnippetsTool } from './list-snippets.ts'
import { updateSnippetTool } from './update-snippet.ts'
import { deleteSnippetTool } from './delete-snippet.ts'
import { listSegmentsTool } from './list-segments.ts'
import { deleteSegmentTool } from './delete-segment.ts'
import { listTagsTool } from './list-tags.ts'
import { deleteTagTool } from './delete-tag.ts'
import { deleteProductTool } from './delete-product.ts'
import { sendMessageToContactTool } from './send-message-to-contact.ts'
import type { AiTool } from './types.ts'

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

export type { AiTool, ToolExecContext, ResourceRef, ToolRisk } from './types.ts'
