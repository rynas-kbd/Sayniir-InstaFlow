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
    listProductsTool,
    createProductTool,
    updateProductTool,
    listOrdersTool,
    updateOrderStatusTool,
  ] as AiTool<never, unknown>[]
).sort((a, b) => a.name.localeCompare(b.name))

export function getToolByName(name: string): AiTool<never, unknown> | undefined {
  return AI_TOOLS.find((tool) => tool.name === name)
}

export type { AiTool, ToolExecContext, ResourceRef, ToolRisk } from './types'
