import { handleCoachingMessage } from './coaching/handler.ts'
import { handleAgencyMessage } from './agency/handler.ts'
import type { AgentChannel } from './messaging.ts'
import type { AgentOutcome } from './types.ts'

export type BusinessType = 'ecommerce' | 'coaching' | 'agency' | 'generic'

export interface AgentMessageArgs {
  accountId: string
  senderId: string
  messageText: string
  channel: AgentChannel
  customInstructions?: string[]
  infosToCollect?: string[]
  history?: string
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}

/**
 * Dispatches a message to the coaching/agency vertical agent. Ecommerce
 * keeps its richer Q&A/greeting-reset logic directly in
 * lib/channels/shared/inbound.ts (Deno-fidelity requirement — see plan
 * Phase 0.5); this router only covers the newer, simpler verticals.
 * Returns null (not handled) for 'ecommerce'/'generic' so the caller falls
 * back to its own routing.
 */
export async function handleAgentMessage(businessType: BusinessType, args: AgentMessageArgs): Promise<AgentOutcome | null> {
  switch (businessType) {
    case 'coaching':
      return handleCoachingMessage(args)
    case 'agency':
      return handleAgencyMessage(args)
    default:
      return null
  }
}
