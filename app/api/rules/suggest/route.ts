import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { callAgentLLM } from '@/lib/agent/engine'

// POST /api/rules/suggest
// Body: { intent: string, channel_account_id?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { intent, channel_account_id } = body
    if (!intent || typeof intent !== 'string') {
      return NextResponse.json({ error: 'Missing `intent` in request body' }, { status: 400 })
    }

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

    const result = await callAgentLLM<any>(prompt)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[SuggestRule] Error:', err)
    return jsonError(500, 'Impossible de générer la suggestion de règle', err)
  }
}
