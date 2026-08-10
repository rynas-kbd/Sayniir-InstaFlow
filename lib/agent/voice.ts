import { transcribeVoiceForEcommerce } from './ecommerce/voice.ts'

/**
 * Provider-agnostic voice transcription for any inbound automation turn.
 * Thin alias over transcribeVoiceForEcommerce — that module is already
 * provider-agnostic (Groq Whisper with a darija/kabyle-tuned prompt, or
 * Gemini, using the account's own configured provider/key rather than a
 * hard-wired Gemini call). Named at this level because voice is no longer
 * ecommerce-specific: it now traverses the exact same dispatch pipeline as
 * text for every vertical (see handleVoiceTurn in
 * lib/channels/shared/inbound.ts), not just the order-taking tunnel (audit
 * finding F8).
 */
export async function transcribeInbound(audioBuffer: Buffer, mimeType: string, aiProvider?: string | null, aiApiKey?: string | null): Promise<string> {
  return transcribeVoiceForEcommerce(audioBuffer, mimeType, aiProvider, aiApiKey)
}
