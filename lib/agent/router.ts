import { handleCoachingMessage } from './coaching/handler'
import { handleAgencyMessage } from './agency/handler'

export type BusinessType = 'ecommerce' | 'coaching' | 'agency' | 'generic'

export interface AgentMessageArgs {
  accountId: string
  pageId: string
  senderId: string
  messageText: string
  accessToken: string
  customInstructions?: string[]
  infosToCollect?: string[]
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}

/**
 * Dispatches a message to the coaching/agency vertical agent. Ecommerce
 * keeps its richer Q&A/greeting-reset logic directly in
 * lib/channels/shared/inbound.ts (Deno-fidelity requirement — see plan
 * Phase 0.5); this router only covers the newer, simpler verticals.
 * Returns false (not handled) for 'ecommerce'/'generic' so the caller falls
 * back to its own routing.
 */
export async function handleAgentMessage(businessType: BusinessType, args: AgentMessageArgs): Promise<boolean> {
  switch (businessType) {
    case 'coaching':
      await handleCoachingMessage(args)
      return true
    case 'agency':
      await handleAgencyMessage(args)
      return true
    default:
      return false
  }
}
