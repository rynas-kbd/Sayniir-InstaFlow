import { isEncrypted, decryptApiKey } from '../crypto'
import { createAdminClient } from '../supabase/admin'
import { PROVIDER_CONFIG, type CopilotProviderKind } from './models'

export interface CopilotProviderResolution {
  kind: CopilotProviderKind
  apiKey: string
  model: string
  byok: boolean
}

const VALID_PROVIDER_KINDS = new Set<CopilotProviderKind>(Object.keys(PROVIDER_CONFIG) as CopilotProviderKind[])

/**
 * Picks one of the platform's Groq keys at random. Deliberately not a shared round-robin
 * counter: on Vercel (serverless) no state reliably survives between invocations, so a random
 * draw per request distributes load across keys just as well without depending on shared state.
 */
function pickGroqApiKey(): string | null {
  const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY
  if (!raw) return null
  const keys = raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  if (keys.length === 0) return null
  return keys[Math.floor(Math.random() * keys.length)]
}

/**
 * Resolves the copilot's provider for a channel account. BYOK (agent_settings.copilot_*) if the
 * plan allows it and a key is configured — any of the 6 providers in PROVIDER_CONFIG. Otherwise
 * the platform default: Groq, one key drawn from the rotation pool. A broken/expired BYOK key
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
            : 'groq'
        if (key) {
          return { kind, apiKey: key, model: settings.copilot_model || PROVIDER_CONFIG[kind].defaultModel, byok: true }
        }
      } catch {
        // Fall through to the platform default — a broken BYOK key must not break the copilot.
      }
    }
  }

  const platformKey = pickGroqApiKey()
  if (!platformKey) throw new Error('GROQ_API_KEYS (ou GROQ_API_KEY) non configurée')
  return { kind: 'groq', apiKey: platformKey, model: PROVIDER_CONFIG.groq.defaultModel, byok: false }
}
