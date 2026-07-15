import { encodeBase64 } from 'jsr:@std/encoding/base64'

export async function downloadAudio(url: string, pageAccessToken?: string): Promise<Uint8Array> {
  const headers: Record<string, string> = {}
  if (pageAccessToken) {
    headers['Authorization'] = `Bearer ${pageAccessToken}`
  }

  try {
    const res = await fetch(url, { headers })
    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer())
    }
  } catch (err) {
    console.error('[downloadAudio] Failed with auth header:', err)
  }

  const resFallback = await fetch(url)
  if (!resFallback.ok) {
    throw new Error(`Failed to download audio. Status: ${resFallback.status}`)
  }
  return new Uint8Array(await resFallback.arrayBuffer())
}

interface GeminiResponse {
  transcription: string
  detectedLanguage: string
  matchedRuleId: string | null
  replyText: string
}

async function callGeminiVoice(
  audioBuffer: Uint8Array,
  cleanMimeType: string,
  base64Data: string,
  prompt: string,
  apiKey: string
): Promise<GeminiResponse> {
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const requestBody = JSON.stringify({
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: cleanMimeType || 'audio/mp4', data: base64Data } },
      ],
    }],
    generation_config: { response_mime_type: 'application/json' },
  })

  let res: Response | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    })
    if ((res.status === 503 || res.status === 429) && attempt < 3) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)))
      continue
    }
    break
  }

  if (!res!.ok) throw new Error(`Gemini API ${res!.status}: ${await res!.text()}`)
  const data = await res!.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return JSON.parse(text.trim())
}

// Prompt de contexte injecté dans Whisper pour forcer la reconnaissance darija/kabyle.
// Whisper utilise ce prompt comme "amorce" — il va continuer dans le même registre linguistique.
const WHISPER_PROMPT =
  'Transcription en arabe algérien (darija) ou kabyle. ' +
  'Exemples de mots courants : wesh, rahi, zebi, sahbi, bezzaf, chkoun, kifah, ' +
  'labas, mzyan, khoya, wlah, nta, ana, makanch, daba, hna, rak, chhal, ' +
  'ndir, ngoul, rani, wahed, zwin, galou, kima, hak, bali, fhemtni.'

function buildLlmPrompt(transcription: string, rules: unknown[]): string {
  return `
Tu es l'assistant d'automatisation pour Instaflow (SaaS d'automatisation Instagram).
Un utilisateur a envoyé un message vocal depuis Instagram. La transcription automatique est :
"${transcription}"

IMPORTANT : L'utilisateur parle probablement en darija algérienne (arabe algérien), en kabyle, en français, ou un mélange.
La darija utilise souvent des mots comme : wesh, zebi, sahbi, bezzaf, labas, mzyan, khoya, ndir, rani, wlah, makanch, daba, kifah, chkoun, etc.
Si la transcription contient des mots arabes/darija, traduis-les et indique la langue.

Tâche :
1. Propose une version lisible de la transcription. Si c'est de la darija/kabyle, ajoute une traduction française.
   Format : "[Darija] <transcription> [Traduction : <traduction française>]"
2. Identifie la règle d'automatisation qui correspond le mieux au sens du message.
   - Priorité aux règles "keyword" dont les mots-clés matchent le sens.
   - Sinon prend la règle "any_message" comme fallback.
   - Si aucune règle : matchedRuleId = null.
3. Mets dans "replyText" le response_text de la règle sélectionnée.
   Si aucune règle : "Merci pour votre message ! Nous vous répondrons très vite. 🙏"

Règles configurées :
${JSON.stringify(rules, null, 2)}

Retourne UNIQUEMENT ce JSON valide :
{
  "transcription": "...",
  "detectedLanguage": "Darija | Kabyle | Français | Mélange | Arabe",
  "matchedRuleId": "uuid ou null",
  "replyText": "..."
}
`
}

function buildGeminiPrompt(rules: unknown[]): string {
  return `
Tu es l'assistant d'automatisation pour Instaflow (SaaS d'automatisation Instagram).
Un utilisateur Instagram a envoyé un message vocal. Il parle probablement en darija algérienne, kabyle, français, ou un mélange.

La darija utilise des mots comme : wesh, zebi, sahbi, bezzaf, labas, mzyan, khoya, ndir, rani, wlah, makanch, daba, kifah, chkoun, etc.

Tâche :
1. Transcris le message vocal. Si c'est de la darija/kabyle, ajoute une traduction française.
   Format : "[Darija] <transcription> [Traduction : <traduction>]"
2. Identifie la règle d'automatisation qui correspond le mieux.
3. Retourne le replyText de la règle sélectionnée.

Règles configurées :
${JSON.stringify(rules, null, 2)}

Retourne UNIQUEMENT ce JSON :
{
  "transcription": "...",
  "detectedLanguage": "Darija | Kabyle | Français | Mélange | Arabe",
  "matchedRuleId": "uuid ou null",
  "replyText": "..."
}
`
}

export async function processVoiceWithGemini(
  audioBuffer: Uint8Array,
  mimeType: string,
  rules: unknown[]
): Promise<GeminiResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  const groqApiKey = Deno.env.get('GROQ_API_KEY')

  if (!apiKey && !groqApiKey) {
    console.warn('[Voice] No API keys configured.')
    return {
      transcription: '[Vocal reçu - Transcription indisponible (clés API manquantes)]',
      detectedLanguage: 'Inconnu',
      matchedRuleId: null,
      replyText: 'Merci pour votre message vocal ! Nous vous répondrons bientôt. 🙏',
    }
  }

  let cleanMimeType = mimeType.split(';')[0].trim()
  if (cleanMimeType === 'video/mp4') cleanMimeType = 'audio/mp4'

  const base64Data = encodeBase64(audioBuffer)

  if (groqApiKey) {
    try {
      console.log('[Voice] Whisper (whisper-large-v3) + Llama (3.3-70b)...')

      // ── Étape 1 : Transcription Whisper avec contexte darija ──────────────
      const formData = new FormData()
      formData.append('file', new Blob([audioBuffer], { type: cleanMimeType }), 'audio.m4a')
      formData.append('model', 'whisper-large-v3')
      formData.append('response_format', 'json')
      formData.append('language', 'ar')          // Force l'arabe → meilleure reconnaissance darija
      formData.append('prompt', WHISPER_PROMPT)  // Contexte darija/kabyle pour guider Whisper

      const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}` },
        body: formData,
      })

      if (!whisperRes.ok) throw new Error(`Whisper error: ${await whisperRes.text()}`)

      const { text: transcription } = await whisperRes.json()
      console.log(`[Voice] Whisper → "${transcription}"`)

      // ── Étape 2 : Analyse sémantique + matching de règles via Llama ───────
      const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: buildLlmPrompt(transcription, rules) }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      })

      if (!llmRes.ok) throw new Error(`Llama error: ${await llmRes.text()}`)

      const llmData = await llmRes.json()
      const result = JSON.parse(llmData.choices?.[0]?.message?.content ?? '{}')

      // Injecte la transcription brute de Whisper si Llama n'en a pas produit une
      if (!result.transcription) result.transcription = transcription

      return result
    } catch (err) {
      console.error('[Voice] Groq pipeline failed, fallback Gemini:', err)
      if (apiKey) {
        try {
          return await callGeminiVoice(audioBuffer, cleanMimeType, base64Data, buildGeminiPrompt(rules), apiKey)
        } catch (geminiErr) {
          console.error('[Voice] Gemini fallback failed:', geminiErr)
        }
      }
    }
  } else {
    try {
      return await callGeminiVoice(audioBuffer, cleanMimeType, base64Data, buildGeminiPrompt(rules), apiKey!)
    } catch (err) {
      console.error('[Voice] Gemini error:', err)
    }
  }

  return {
    transcription: '[Vocal reçu - Échec de la transcription]',
    detectedLanguage: 'Erreur',
    matchedRuleId: null,
    replyText: "Merci pour votre message vocal ! Nous l'avons bien reçu et nous vous répondrons très vite. 🙏",
  }
}

// ─── Transcription vocale pour le flow e-commerce ───────────────────────────
// Transcrit le vocal et retourne le texte brut.
// Le webhook appelle ensuite handleEcommerceMessage() avec ce texte,
// exactement comme si le client avait tapé le message.
export async function transcribeVoiceForEcommerce(
  audioBuffer: Uint8Array,
  mimeType: string,
  aiProvider?: string | null,
  aiApiKey?: string | null,
  // Kept for call-site/API compatibility with callers that select a model per-provider
  // (see ecommerce.ts's callLLM). Not currently used: transcription always uses a
  // fixed model per provider (whisper-large-v3 / gemini-1.5-flash).
  // deno-lint-ignore no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  aiModel?: string | null
): Promise<string> {
  // Determine provider and API key based on parameters or environment
  const provider = aiProvider || (aiApiKey ? 'custom' : null);
  const providedKey = aiApiKey || (provider === 'groq' ? Deno.env.get('GROQ_API_KEY') : provider === 'gemini' ? Deno.env.get('GEMINI_API_KEY') : null);
  const envGroqKey = Deno.env.get('GROQ_API_KEY');
  const envGeminiKey = Deno.env.get('GEMINI_API_KEY');

  let cleanMimeType = mimeType.split(';')[0].trim();
  if (cleanMimeType === 'video/mp4') cleanMimeType = 'audio/mp4';

  // Helper to attempt Groq Whisper transcription
  const tryGroqWhisper = async (key: string) => {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: cleanMimeType }), 'audio.m4a');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');
      formData.append('language', 'ar');
      formData.append('prompt', WHISPER_PROMPT);
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Whisper error: ${await res.text()}`);
      const { text } = await res.json();
      console.log(`[Voice/Ecommerce] Whisper → "${text}"`);
      return text ?? '';
    } catch (err) {
      console.error('[Voice/Ecommerce] Whisper failed:', err);
      return null;
    }
  };

  // Helper to attempt Gemini transcription
  const tryGemini = async (key: string) => {
    try {
      const base64Data = encodeBase64(audioBuffer);
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Transcris ce message vocal mot pour mot, en conservant la langue originale (darija, kabyle, français ou arabe). Retourne uniquement le texte transcrit, sans explication.' },
              { inlineData: { mimeType: cleanMimeType, data: base64Data } },
            ],
          }],
        }),
      });
      if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      console.log(`[Voice/Ecommerce] Gemini → "${text}"`);
      return text.trim();
    } catch (err) {
      console.error('[Voice/Ecommerce] Gemini failed:', err);
      return null;
    }
  };

  // ── Choose provider ────────────────────────────────────────────────
  let transcription: string | null = null;
  if (provider) {
    // Custom provider supplied
    if (provider === 'groq' && providedKey) {
      transcription = await tryGroqWhisper(providedKey);
    } else if (provider === 'gemini' && providedKey) {
      transcription = await tryGemini(providedKey);
    } else if (provider === 'custom' && providedKey) {
      // Attempt Groq first, fallback to Gemini based on key pattern (simple heuristic)
      if (providedKey.length > 40) { // assume Groq keys are longer
        transcription = await tryGroqWhisper(providedKey);
        if (!transcription) transcription = await tryGemini(providedKey);
      } else {
        transcription = await tryGemini(providedKey);
      }
    }
  } else {
    // No explicit provider, fallback to environment keys (Groq preferred)
    if (envGroqKey) {
      transcription = await tryGroqWhisper(envGroqKey);
    }
    if (!transcription && envGeminiKey) {
      transcription = await tryGemini(envGeminiKey);
    }
  }

  if (transcription) return transcription;

  // If all attempts failed
  console.warn('[Voice/Ecommerce] All transcription attempts failed.');
  return '';
}