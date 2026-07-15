/**
 * Voice transcription for the e-commerce flow — ported verbatim from the
 * live supabase/functions/_shared/meta/voice.ts::transcribeVoiceForEcommerce
 * (darija/kabyle-tuned Whisper prompt), which lib/meta/voice.ts never had.
 */

const WHISPER_PROMPT =
  'Transcription en arabe algérien (darija) ou kabyle. ' +
  'Exemples de mots courants : wesh, rahi, zebi, sahbi, bezzaf, chkoun, kifah, ' +
  'labas, mzyan, khoya, wlah, nta, ana, makanch, daba, hna, rak, chhal, ' +
  'ndir, ngoul, rani, wahed, zwin, galou, kima, hak, bali, fhemtni.'

async function tryGroqWhisper(audioBuffer: Buffer, cleanMimeType: string, key: string): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: cleanMimeType }), 'audio.m4a')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'json')
    formData.append('language', 'ar')
    formData.append('prompt', WHISPER_PROMPT)
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: formData,
    })
    if (!res.ok) throw new Error(`Whisper error: ${await res.text()}`)
    const { text } = await res.json()
    return text ?? ''
  } catch (err) {
    console.error('[Voice/Ecommerce] Whisper failed:', err)
    return null
  }
}

async function tryGemini(audioBuffer: Buffer, cleanMimeType: string, key: string): Promise<string | null> {
  try {
    const base64Data = audioBuffer.toString('base64')
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Transcris ce message vocal mot pour mot, en conservant la langue originale (darija, kabyle, français ou arabe). Retourne uniquement le texte transcrit, sans explication.',
              },
              { inlineData: { mimeType: cleanMimeType, data: base64Data } },
            ],
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return text.trim()
  } catch (err) {
    console.error('[Voice/Ecommerce] Gemini failed:', err)
    return null
  }
}

export async function transcribeVoiceForEcommerce(
  audioBuffer: Buffer,
  mimeType: string,
  aiProvider?: string | null,
  aiApiKey?: string | null
): Promise<string> {
  const provider = aiProvider || (aiApiKey ? 'custom' : null)
  const providedKey =
    aiApiKey || (provider === 'groq' ? process.env.GROQ_API_KEY : provider === 'gemini' ? process.env.GEMINI_API_KEY : null)
  const envGroqKey = process.env.GROQ_API_KEY
  const envGeminiKey = process.env.GEMINI_API_KEY

  let cleanMimeType = mimeType.split(';')[0].trim()
  if (cleanMimeType === 'video/mp4') cleanMimeType = 'audio/mp4'

  let transcription: string | null = null

  if (provider) {
    if (provider === 'groq' && providedKey) {
      transcription = await tryGroqWhisper(audioBuffer, cleanMimeType, providedKey)
    } else if (provider === 'gemini' && providedKey) {
      transcription = await tryGemini(audioBuffer, cleanMimeType, providedKey)
    } else if (provider === 'custom' && providedKey) {
      if (providedKey.length > 40) {
        transcription = await tryGroqWhisper(audioBuffer, cleanMimeType, providedKey)
        if (!transcription) transcription = await tryGemini(audioBuffer, cleanMimeType, providedKey)
      } else {
        transcription = await tryGemini(audioBuffer, cleanMimeType, providedKey)
      }
    }
  } else {
    if (envGroqKey) transcription = await tryGroqWhisper(audioBuffer, cleanMimeType, envGroqKey)
    if (!transcription && envGeminiKey) transcription = await tryGemini(audioBuffer, cleanMimeType, envGeminiKey)
  }

  if (transcription) return transcription

  console.warn('[Voice/Ecommerce] All transcription attempts failed.')
  return ''
}
