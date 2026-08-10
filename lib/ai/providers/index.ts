import { streamAnthropicTurn } from './anthropic.ts'
import { streamOpenAiCompatibleTurn } from './openai-compatible.ts'
import { PROVIDER_CONFIG } from '../models.ts'
import type { CopilotProviderKind, ProviderStreamEvent, ProviderTurnParams } from './types.ts'

/** Dispatches to the right adapter — switch-based, matching lib/agent/engine.ts::callAgentLLM's style rather than an interface/class hierarchy. */
export async function streamProviderTurn(
  kind: CopilotProviderKind,
  params: ProviderTurnParams,
  onEvent: (event: ProviderStreamEvent) => void
): Promise<void> {
  if (kind === 'anthropic') {
    return streamAnthropicTurn(params, onEvent)
  }

  const baseUrl = PROVIDER_CONFIG[kind].baseUrl
  if (!baseUrl) throw new Error(`Aucune baseUrl configurée pour le provider "${kind}"`)
  return streamOpenAiCompatibleTurn({ ...params, baseUrl }, onEvent)
}

export type { CopilotProviderKind, ProviderStreamEvent, ProviderTurnParams } from './types.ts'
