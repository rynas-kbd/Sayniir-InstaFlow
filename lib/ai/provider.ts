import { isEncrypted, decryptApiKey } from '../crypto.ts'
import { createAdminClient } from '../supabase/admin.ts'
import { PROVIDER_CONFIG, type CopilotProviderKind } from './models.ts'

export interface CopilotProviderResolution {
  kind: CopilotProviderKind
  apiKey: string
  model: string
  byok: boolean
}

const VALID_PROVIDER_KINDS = new Set<CopilotProviderKind>(Object.keys(PROVIDER_CONFIG) as CopilotProviderKind[])

/**
 * Picks one of the platform's OpenRouter or Groq keys at random. OpenRouter is
 * preferred when configured, with Groq as a backward-compatible fallback.
 */
function pickPlatformApiKey(): { kind: CopilotProviderKind; apiKey: string } | null {
  const rawOpenRouter = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY
  const rawGroq = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY

  function chooseRandomKey(raw: string): string | null {
    const keys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    if (keys.length === 0) return null
    return keys[Math.floor(Math.random() * keys.length)]
  }

  const openRouterKey = rawOpenRouter ? chooseRandomKey(rawOpenRouter) : null
  if (openRouterKey) return { kind: 'openrouter', apiKey: openRouterKey }

  const groqKey = rawGroq ? chooseRandomKey(rawGroq) : null
  if (groqKey) return { kind: 'groq', apiKey: groqKey }

  return null
}

/**
 * Resolves the copilot's provider for a channel account. BYOK (agent_settings.copilot_*) if the
 * plan allows it and a key is configured — any of the 6 providers in PROVIDER_CONFIG. Otherwise
 * the platform default: OpenRouter, one key drawn from the rotation pool. A broken/expired BYOK key
 * falls back to the platform default rather than failing the turn outright.
 */
export async function resolveCopilotProvider(
  channelAccountId: string,
  byokAllowed: boolean
): Promise<CopilotProviderResolution> {
  if (byokAllowed) {
    const supabase = createAdminClient()
    const { data: settings } = await supabase
      .from('agent_settings')
      .select('copilot_provider, copilot_api_key, copilot_model, copilot_enabled')
      .eq('channel_account_id', channelAccountId)
      .maybeSingle()

    if (settings?.copilot_enabled && settings.copilot_api_key) {
      try {
        const key = isEncrypted(settings.copilot_api_key)
          ? await decryptApiKey(settings.copilot_api_key)
          : settings.copilot_api_key
        const kind =
          settings.copilot_provider && VALID_PROVIDER_KINDS.has(settings.copilot_provider as CopilotProviderKind)
            ? (settings.copilot_provider as CopilotProviderKind)
            : 'openrouter'
        if (key) {
          return { kind, apiKey: key, model: settings.copilot_model || PROVIDER_CONFIG[kind].defaultModel, byok: true }
        }
      } catch {
        // Fall through to the platform default — a broken BYOK key must not break the copilot.
      }
    }
  }

  const platform = pickPlatformApiKey()
  if (!platform) throw new Error('OPENROUTER_API_KEYS/OPENROUTER_API_KEY or GROQ_API_KEYS/GROQ_API_KEY non configurée')
  return { kind: platform.kind, apiKey: platform.apiKey, model: PROVIDER_CONFIG[platform.kind].defaultModel, byok: false }
}
