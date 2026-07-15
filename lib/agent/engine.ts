/**
 * Multi-provider LLM engine — ported from the live
 * supabase/functions/_shared/meta/ecommerce.ts (Deno), which supports 5
 * providers where lib/meta/ecommerce.ts only supported 2 (Gemini/Groq).
 * This is the single call site every lib/agent/* prompt handler should use.
 */

async function callLLMWithGemini<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generation_config: { response_mime_type: 'application/json' },
        }),
      }
    )
    if ((res.status === 503 || res.status === 429) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
      continue
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini: empty response')
    return JSON.parse(text.trim()) as T
  }
  throw new Error('Gemini: all retries failed')
}

async function callLLMWithGroq<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq: empty response')
  return JSON.parse(text) as T
}

async function callLLMWithOpenAI<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI: empty response')
  return JSON.parse(text) as T
}

async function callLLMWithAnthropic<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Anthropic: empty response')
  let cleanText = text.trim()
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7, cleanText.length - 3).trim()
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3, cleanText.length - 3).trim()
  }
  return JSON.parse(cleanText) as T
}

async function callLLMWithOpenRouter<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://instaflow.io',
      'X-Title': 'Instaflow',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenRouter: empty response')
  return JSON.parse(text) as T
}

export async function callAgentLLM<T>(
  prompt: string,
  aiProvider?: string | null,
  aiApiKey?: string | null,
  aiModel?: string | null
): Promise<T> {
  const provider = aiProvider || 'gemini'
  const apiKey =
    aiApiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : provider === 'groq' ? process.env.GROQ_API_KEY : null)
  const model = aiModel || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : '')

  if (!apiKey) {
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      return callLLMWithGemini<T>(prompt, process.env.GEMINI_API_KEY, model || 'gemini-1.5-flash')
    }
    if (provider === 'groq' && process.env.GROQ_API_KEY) {
      return callLLMWithGroq<T>(prompt, process.env.GROQ_API_KEY, model || 'llama-3.3-70b-versatile')
    }
    const systemGemini = process.env.GEMINI_API_KEY
    if (systemGemini) {
      return callLLMWithGemini<T>(prompt, systemGemini, 'gemini-1.5-flash')
    }
    throw new Error(`Aucune clé API disponible pour le fournisseur: ${provider}`)
  }

  switch (provider) {
    case 'gemini':
      return callLLMWithGemini<T>(prompt, apiKey, model || 'gemini-1.5-flash')
    case 'groq':
      return callLLMWithGroq<T>(prompt, apiKey, model || 'llama-3.3-70b-versatile')
    case 'openai':
      return callLLMWithOpenAI<T>(prompt, apiKey, model || 'gpt-4o-mini')
    case 'anthropic':
      return callLLMWithAnthropic<T>(prompt, apiKey, model || 'claude-3-5-sonnet-20241022')
    case 'openrouter':
      return callLLMWithOpenRouter<T>(prompt, apiKey, model || 'meta-llama/llama-3.3-70b-instruct')
    default:
      throw new Error(`Fournisseur d'IA non supporté: ${provider}`)
  }
}
