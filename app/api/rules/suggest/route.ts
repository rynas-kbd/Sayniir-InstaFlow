import { NextRequest, NextResponse } from 'next/server'
import { jsonError, badRequest } from '@/lib/api/errors'
import { callAgentLLM } from '@/lib/agent/engine'
import { requireUser, requireAccountOwnership } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'

// POST /api/rules/suggest
// Body: { intent: string, channel_account_id?: string }
function parseMaybeJson<T>(payload: unknown): T {
  if (typeof payload === 'object' && payload !== null) {
    return payload as T
  }
  if (typeof payload !== 'string') {
    throw new Error(`Unexpected suggestion payload type: ${typeof payload}`)
  }

  let text = payload.trim()
  if (text.startsWith('```json')) {
    text = text.slice(7).trim()
    if (text.endsWith('```')) text = text.slice(0, -3).trim()
  } else if (text.startsWith('```')) {
    text = text.slice(3).trim()
    if (text.endsWith('```')) text = text.slice(0, -3).trim()
  }

  return JSON.parse(text) as T
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  try {
    const body = await req.json().catch(() => null)
    const intent = body?.intent
    const channel_account_id = body?.channel_account_id
    if (!intent || typeof intent !== 'string') {
      return badRequest('Missing `intent` in request body')
    }
    if (!intent.trim() || intent.length > 500) {
      return badRequest("L'intention doit faire entre 1 et 500 caractères")
    }
    if (!channel_account_id || typeof channel_account_id !== 'string') {
      return badRequest('channel_account_id requis')
    }
    const ownership = await requireAccountOwnership(supabase, channel_account_id, user.id)
    if (ownership !== true) return ownership

    const rl = checkRateLimit(`rules:suggest:${user.id}`, 15, 60_000)
    if (!rl.allowed) return jsonError(429, 'Trop de suggestions, réessayez dans une minute')

    const prompt = `Tu es un assistant qui transforme une phrase d'intention en définition claire d'une règle d'automatisation Instagram.

Entrée (intention):
"""
${intent}
"""

Tâche: Retourne STRICTEMENT un JSON valide (sans texte additionnel) avec la structure suivante:
{
  "title": "Titre court (max 8 mots)",
  "summary": "Résumé concis en 1-2 phrases",
  "trigger": { "type": "keyword" | "any", "keywords": ["..." ] },
  "actions": [ { "type": "reply" | "ask" | "tag" | "goto", "payload": { /* dépend du type */ } } ],
  "examples": ["Utilisateur exemple 1", "Utilisateur exemple 2", "Utilisateur exemple 3"],
  "uiOptions": ["Publier", "Modifier", "Ajouter condition", "Annuler"]
}

Règles:
- Si l'intention mentionne des mots-clés explicites, utilisez trigger.type = "keyword" et extrayez 1-6 keywords concis.
- Si l'intention est générale (ex: "répondre à tout message"), utilisez trigger.type = "any" et keywords = [].
- Pour actions:
  - reply: { type: "reply", payload: { text: "Réponse texte" } }
  - ask: { type: "ask", payload: { question: "Question à poser" } }
  - tag: { type: "tag", payload: { tag: "nom_du_tag" } }
  - goto: { type: "goto", payload: { nodeId: "(placeholder)" } }
- Fournis 2-3 exemples courts d'entrées utilisateur qui déclencheraient cette règle.

Donne uniquement le JSON demandé.`

    const result = await callAgentLLM<unknown>(prompt)
    const suggestion = parseMaybeJson<any>(result)
    return NextResponse.json(suggestion)
  } catch (err: any) {
    console.error('[SuggestRule] Error:', err)
    return jsonError(500, 'Impossible de générer la suggestion de règle', err)
  }
}
