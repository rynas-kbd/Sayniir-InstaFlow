/**
 * Multi-provider LLM engine — ported from the live
 * supabase/functions/_shared/meta/ecommerce.ts (Deno), which supports 5
 * providers where lib/meta/ecommerce.ts only supported 2 (Gemini/Groq).
 * This is the single call site every lib/agent/* prompt handler should use.
 */

function parseJsonObject<T>(content: unknown): T {
  if (typeof content === 'object' && content !== null) {
    return content as T
  }
  if (typeof content !== 'string') {
    throw new Error(`Unexpected response type: ${typeof content}`)
  }

  let text = content.trim()
  if (text.startsWith('```json')) {
    text = text.slice(7).trim()
    if (text.endsWith('```')) text = text.slice(0, -3).trim()
  } else if (text.startsWith('```')) {
    text = text.slice(3).trim()
    if (text.endsWith('```')) text = text.slice(0, -3).trim()
  }

  try {
    return JSON.parse(text) as T
  } catch (err: unknown) {
    throw new Error(
      `Failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}. Raw response: ${text}`
    )
  }
}

/** Every fetch to a provider gets an upper bound — none of them had one before,
 *  so a hung connection to a slow/overloaded model (the free-tier OpenRouter
 *  model in particular) blocked the whole webhook turn indefinitely instead
 *  of failing fast enough for `withRetry`/the caller to recover. */
const LLM_TIMEOUT_MS = 12_000
const MAX_RETRIES = 2

/** Carries the HTTP status so `withRetry` can tell a transient failure
 *  (429/5xx) from a permanent one (401/400) without re-parsing error text. */
class LLMHttpError extends Error {
  constructor(
    public readonly provider: string,
    public readonly status: number,
    body: string
  ) {
    super(`${provider} ${status}: ${body}`)
  }
}

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(LLM_TIMEOUT_MS) })
}

/** Uniform retry/backoff across all 5 providers — previously only Gemini had
 *  a bespoke retry loop; Groq/OpenAI/Anthropic/OpenRouter failed the whole
 *  turn (surfacing as "problème technique" to the customer) on a single
 *  transient 429/5xx or timeout. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError'
      const status = err instanceof LLMHttpError ? err.status : undefined
      const isRetryable = isTimeout || status === 429 || (status !== undefined && status >= 500)
      if (!isRetryable || attempt > MAX_RETRIES) throw lastErr
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
  }
  throw lastErr
}

async function callLLMWithGemini<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generation_config: { response_mime_type: 'application/json' },
      }),
    })
    if (!res.ok) throw new LLMHttpError('Gemini', res.status, await res.text())
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini: empty response')
    return JSON.parse(text.trim()) as T
  })
}

async function callLLMWithGroq<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    })
    if (!res.ok) throw new LLMHttpError('Groq', res.status, await res.text())
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content === undefined || content === null) throw new Error('Groq: empty response')
    return parseJsonObject<T>(content)
  })
}

async function callLLMWithOpenAI<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    })
    if (!res.ok) throw new LLMHttpError('OpenAI', res.status, await res.text())
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content === undefined || content === null) throw new Error('OpenAI: empty response')
    return parseJsonObject<T>(content)
  })
}

async function callLLMWithAnthropic<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
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
    if (!res.ok) throw new LLMHttpError('Anthropic', res.status, await res.text())
    const data = await res.json()
    const text = data.content?.[0]?.text
    if (!text) throw new Error('Anthropic: empty response')
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7).trim()
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3).trim()
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3).trim()
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3).trim()
    }
    return JSON.parse(cleanText) as T
  })
}

async function callLLMWithOpenRouter<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://instaflow.io',
        'X-Title': 'Instaflow',
      },
      body: JSON.stringify({
        model: model || 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    })
    if (!res.ok) throw new LLMHttpError('OpenRouter', res.status, await res.text())
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content === undefined || content === null) throw new Error('OpenRouter: empty response')
    return parseJsonObject<T>(content)
  })
}

export async function callAgentLLM<T>(
  prompt: string,
  aiProvider?: string | null,
  aiApiKey?: string | null,
  aiModel?: string | null
): Promise<T> {
  let safePrompt = prompt
  try {
    // dynamic import so server/bundle size is minimal
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sanitizeForByteString } = await import('../encoding/sanitize')
    safePrompt = sanitizeForByteString(prompt)
  } catch (err) {
    console.warn('[LLM] sanitizeForByteString failed, using raw prompt', err)
    safePrompt = prompt
  }

  const provider = aiProvider || 'openrouter'
  const apiKey =
    aiApiKey ||
    (provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'groq'
      ? process.env.GROQ_API_KEY
      : provider === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : null)
  const model =
    aiModel ||
    (provider === 'gemini'
      ? 'gemini-2.0-flash'
      : provider === 'groq'
      ? 'llama-3.3-70b-versatile'
      : provider === 'openrouter'
      ? 'nvidia/nemotron-3-ultra-550b-a55b:free'
      : '')

  if (!apiKey) {
    if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      return callLLMWithOpenRouter<T>(safePrompt, process.env.OPENROUTER_API_KEY, model || 'nvidia/nemotron-3-ultra-550b-a55b:free')
    }
    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      return callLLMWithGemini<T>(safePrompt, process.env.GEMINI_API_KEY, model || 'gemini-2.0-flash')
    }
    if (provider === 'groq' && process.env.GROQ_API_KEY) {
      return callLLMWithGroq<T>(safePrompt, process.env.GROQ_API_KEY, model || 'llama-3.3-70b-versatile')
    }
    const systemOpenRouter = process.env.OPENROUTER_API_KEY
    if (systemOpenRouter) {
      return callLLMWithOpenRouter<T>(safePrompt, systemOpenRouter, model || 'nvidia/nemotron-3-ultra-550b-a55b:free')
    }
    const systemGroq = process.env.GROQ_API_KEY
    if (systemGroq) {
      return callLLMWithGroq<T>(safePrompt, systemGroq, 'llama-3.3-70b-versatile')
    }
    const systemGemini = process.env.GEMINI_API_KEY
    if (systemGemini) {
      return callLLMWithGemini<T>(safePrompt, systemGemini, 'gemini-2.0-flash')
    }
    throw new Error(`Aucune clé API disponible pour le fournisseur: ${provider}`)
  }

  switch (provider) {
    case 'gemini':
      return callLLMWithGemini<T>(safePrompt, apiKey, model || 'gemini-2.0-flash')
    case 'groq':
      return callLLMWithGroq<T>(safePrompt, apiKey, model || 'llama-3.3-70b-versatile')
    case 'openai':
      return callLLMWithOpenAI<T>(safePrompt, apiKey, model || 'gpt-4o-mini')
    case 'anthropic':
      return callLLMWithAnthropic<T>(safePrompt, apiKey, model || 'claude-3-5-sonnet-20241022')
    case 'openrouter':
      return callLLMWithOpenRouter<T>(safePrompt, apiKey, model || 'nvidia/nemotron-3-ultra-550b-a55b:free')
    default:
      throw new Error(`Fournisseur d'IA non supporté: ${provider}`)
  }
}
