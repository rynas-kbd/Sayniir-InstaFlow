
/**
 * Downloads a voice/audio message file from Meta lookaside URL.
 * Handles lookaside authentication with or without page access token.
 */
export async function downloadAudio(url: string, pageAccessToken?: string): Promise<Buffer> {
  const headers: Record<string, string> = {}
  if (pageAccessToken) {
    headers['Authorization'] = `Bearer ${pageAccessToken}`
  }

  try {
    const res = await fetch(url, { headers })
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
  } catch (err) {
    console.error('[downloadAudio] Failed to download with authorization header:', err)
  }

  // Fallback: try download without authorization header (Meta lookaside URLs are often signed and public)
  const resFallback = await fetch(url)
  if (!resFallback.ok) {
    throw new Error(`Failed to download audio from Meta. Status: ${resFallback.status}`)
  }

  const arrayBuffer = await resFallback.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

interface GeminiResponse {
  transcription: string
  detectedLanguage: string
  matchedRuleId: string | null
  replyText: string
}

async function callGeminiVoice(
  audioBuffer: Buffer,
  cleanMimeType: string,
  base64Data: string,
  prompt: string,
  apiKey: string
): Promise<GeminiResponse> {
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: cleanMimeType || 'audio/mp4',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generation_config: {
      response_mime_type: 'application/json',
    },
  });

  let res: Response | null = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    // Retry on transient errors (503 overloaded, 429 rate limit)
    if ((res.status === 503 || res.status === 429) && attempt < maxAttempts) {
      const waitMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
      console.warn(`[Voice] Gemini ${res.status} on attempt ${attempt}/${maxAttempts}, retrying in ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }
    break;
  }

  if (!res!.ok) {
    const errText = await res!.text()
    throw new Error(`Gemini API returned status ${res!.status}: ${errText}`)
  }

  const data = await res!.json()
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textResponse) {
    throw new Error('Gemini API returned an empty response')
  }

  return JSON.parse(textResponse.trim())
}

/**
 * Sends the audio buffer to Google Gemini 1.5 Flash multimodal REST API (or Groq Whisper + Llama 3.3).
 * Gemini transcribes the Darija/Kabyle speech and maps it to the best automation rule.
 */
export async function processVoiceWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  // Automation rules are only ever JSON.stringify'd into the LLM prompt here,
  // never read field-by-field, so an `unknown[]` is sufficient and keeps this
  // decoupled from the `automation_rules` row shape (see lib/meta/comments.ts).
  rules: unknown[]
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY

  if (!apiKey && !groqApiKey) {
    console.warn('[processVoiceWithGemini] ⚠️ Neither GEMINI_API_KEY nor GROQ_API_KEY is defined in env variables.')
    return {
      transcription: '[Vocal reçu - Transcription indisponible (Clés API manquantes)]',
      detectedLanguage: 'Inconnu',
      matchedRuleId: null,
      replyText: 'Merci pour votre message vocal ! Nous vous répondrons bientôt. 🙏',
    }
  }

  const base64Data = audioBuffer.toString('base64')

  // Normalise the mime type if it contains parameters or is video/mp4 (often sent by Meta for audio notes)
  let cleanMimeType = mimeType.split(';')[0].trim()
  if (cleanMimeType === 'video/mp4') {
    cleanMimeType = 'audio/mp4' // Gemini expects audio/mp4 for audio content
  }

  const prompt = `
Tu es l'assistant d'automatisation vocale pour l'application Instaflow (solution SaaS d'automatisation Instagram).
Un utilisateur Instagram a envoyé un message vocal. Cet utilisateur parle probablement en arabe algérien (Darija), en Kabyle (Berber), en français ou dans un mélange de ces langues.

Tâche :
1. Écoute attentivement le message vocal ou analyse sa transcription. Propose une transcription lisible du message. Si la personne parle en Darija ou en Kabyle, transcris au mieux (phonétiquement ou en caractères usuels) et indique entre crochets la langue détectée, puis ajoute une traduction française claire pour que l'administrateur du compte comprenne immédiatement de quoi il s'agit.
   Exemple : "[Darija] Koulchi mlih ? [Traduction : Tout va bien ?]"
2. Analyse le sens sémantique de ce message vocal pour voir s'il correspond à l'une des règles d'automatisation configurées.
3. Compare le message avec les règles ci-dessous :
   - Sélectionne la règle de type "keyword" (mot-clé) dont les mots-clés correspondent au sens ou sont présents dans le message vocal.
   - S'il n'y a pas de correspondance par mot-clé, sélectionne la règle de type "any_message" (qui sert de message d'accueil ou de réponse globale par défaut).
   - Si aucune règle n'est disponible ou configurée pour ce compte, sélectionne null pour matchedRuleId.
4. Remplis le champ "replyText" avec le texte de réponse configuré pour la règle sélectionnée (response_text). Si aucune règle n'est trouvée, utilise cette réponse générique chaleureuse en français : "Merci pour votre message vocal ! Nous l'avons bien reçu et nous vous répondrons très vite. 🙏".

Règles d'automatisation configurées :
${JSON.stringify(rules, null, 2)}

Renvoie UNIQUEMENT un objet JSON respectant précisément le schéma suivant :
{
  "transcription": "Transcription claire avec langue détectée et traduction en français si nécessaire",
  "detectedLanguage": "Ex: Darija / Kabyle / Français / Mélange",
  "matchedRuleId": "ID de la règle sélectionnée (string ou null)",
  "replyText": "Le texte de réponse finale"
}
`

  // 1. Try Groq (Whisper + Llama) if key is present
  if (groqApiKey) {
    try {
      console.log('[Voice] Using Groq (Whisper-large-v3 + Llama-3.3-70b)...')
      
      // A. Transcribe with Whisper
      const WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
      const formData = new FormData()
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: cleanMimeType || 'audio/mp4' })
      formData.append('file', blob, 'audio.m4a')
      formData.append('model', 'whisper-large-v3')
      formData.append('response_format', 'json')

      const whisperRes = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData,
      })

      if (!whisperRes.ok) {
        throw new Error(`Groq Whisper error: ${await whisperRes.text()}`)
      }

      const whisperData = await whisperRes.json()
      const textTranscription = whisperData.text || ''
      console.log(`[Voice] Groq Whisper transcribed: "${textTranscription}"`)

      // B. Process transcription semantic rules using Llama
      const groqPrompt = `
Tu es l'assistant d'automatisation vocale pour l'application Instaflow (solution SaaS d'automatisation Instagram).
Un utilisateur Instagram a envoyé un message vocal qui a été transcrit automatiquement.
La transcription obtenue est : "${textTranscription}"

Tâche :
1. Analyse la transcription. Propose une version claire et lisible en français pour que l'administrateur comprenne immédiatement de quoi il s'agit.
2. Si la personne parle en arabe algérien (Darija) ou en Kabyle (Berber) ou dans un mélange de ces langues, indique entre crochets la langue détectée, puis ajoute une traduction française claire dans le champ "transcription".
   Exemple : "[Darija] Koulchi mlih ? [Traduction : Tout va bien ?]"
3. Analyse le sens sémantique de cette transcription pour voir s'il correspond à l'une des règles d'automatisation configurées.
4. Compare le message avec les règles ci-dessous :
   - Sélectionne la règle de type "keyword" (mot-clé) dont les mots-clés correspondent au sens ou sont présents dans le message vocal.
   - S'il n'y a pas de correspondance par mot-clé, sélectionne la règle de type "any_message" (qui sert de message d'accueil ou de réponse globale par défaut).
   - Si aucune règle n'est disponible ou configurée pour ce compte, sélectionne null pour matchedRuleId.
5. Remplis le champ "replyText" avec le texte de réponse configuré pour la règle sélectionnée (response_text). Si aucune règle n'est trouvée, utilise cette réponse générique chaleureuse en français : "Merci pour votre message vocal ! Nous l'avons bien reçu et nous vous répondrons très vite. 🙏".

Règles d'automatisation configurées :
${JSON.stringify(rules, null, 2)}

Renvoie UNIQUEMENT un objet JSON respectant précisément le schéma suivant :
{
  "transcription": "Transcription claire avec langue détectée et traduction en français si nécessaire",
  "detectedLanguage": "Ex: Darija / Kabyle / Français / Mélange",
  "matchedRuleId": "ID de la règle sélectionnée (string ou null)",
  "replyText": "Le texte de réponse finale"
}
`

      const LLM_URL = 'https://api.groq.com/openai/v1/chat/completions'
      const llmRes = await fetch(LLM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: groqPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      })

      if (!llmRes.ok) {
        throw new Error(`Groq LLM error: ${await llmRes.text()}`)
      }

      const llmData = await llmRes.json()
      const textResponse = llmData.choices?.[0]?.message?.content || '{}'
      return JSON.parse(textResponse.trim())
    } catch (err) {
      console.error('[Voice] Groq processing failed, falling back to Gemini...', err)
      if (apiKey) {
        try {
          return await callGeminiVoice(audioBuffer, cleanMimeType, base64Data, prompt, apiKey)
        } catch (geminiErr) {
          console.error('[Voice] Gemini fallback failed:', geminiErr)
        }
      }
    }
  } else {
    // 2. Default to Gemini
    try {
      return await callGeminiVoice(audioBuffer, cleanMimeType, base64Data, prompt, apiKey!)
    } catch (err) {
      console.error('[processVoiceWithGemini] Error calling Gemini API:', err)
    }
  }

  // 3. Absolute fallback
  return {
    transcription: '[Vocal reçu - Échec de la transcription automatique]',
    detectedLanguage: 'Erreur',
    matchedRuleId: null,
    replyText: "Merci pour votre message vocal ! Nous l'avons bien reçu et nous vous répondrons très vite. 🙏",
  }
}
