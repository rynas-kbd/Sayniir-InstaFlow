import { createAdminClient } from '../../supabase/admin.ts'
import { callAgentLLM } from '../engine.ts'
import { sendAndReport, type AgentChannel } from '../messaging.ts'
import { fenceUserText } from '../history.ts'
import { checkConfidenceEscalation } from '../confidence.ts'
import type { AgentOutcome } from '../types.ts'

/** No per-language template system in this vertical (unlike ecommerce) — a single French default matches the existing "Désolé, problème technique..." fallback tone. */
const HUMAN_HANDOFF_TEXT = "D'accord, je vous mets en relation avec un membre de notre équipe pour être sûr de bien vous aider. Un instant svp 🙏"

/**
 * Coaching vertical — appointment booking agent. New build (no existing
 * Deno/Node precedent, unlike ecommerce). Deliberately simpler than the
 * e-commerce flow: single LLM call per turn, no separate Q&A mode.
 *
 * Scheduling is intentionally NOT auto-confirmed to an exact timestamp —
 * natural-language date/time parsing is unreliable enough that silently
 * booking the wrong slot is worse than asking the business owner to
 * confirm. desired_datetime stays free text; appointments are created with
 * status='pending' and scheduled_at=null for the owner to finalize
 * (Phase 5 dashboard).
 */

interface CoachingLlmResult {
  extractedData: {
    desired_service?: string | null
    desired_datetime?: string | null
    client_name?: string | null
    client_phone?: string | null
    extra_data?: Record<string, string>
  }
  isQuestion: boolean
  questionReply: string | null
  readyToBook: boolean
  replyText: string
  confidence?: number
}

export async function handleCoachingMessage({
  accountId,
  senderId,
  messageText,
  channel,
  customInstructions = [],
  infosToCollect = [],
  history = '',
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string
  senderId: string
  messageText: string
  channel: AgentChannel
  customInstructions?: string[]
  infosToCollect?: string[]
  /** Pre-rendered block from lib/agent/history.ts::renderHistoryBlock, or '' for none. */
  history?: string
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<AgentOutcome> {
  const route = 'coaching'
  const supabase = createAdminClient()

  let { data: session } = await supabase
    .from('booking_sessions')
    .select('*')
    .eq('channel_account_id', accountId)
    .eq('external_user_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .maybeSingle()

  if (!session) {
    const { data: newSession, error } = await supabase
      .from('booking_sessions')
      .upsert(
        {
          channel_account_id: accountId,
          external_user_id: senderId,
          status: 'gathering_info',
          extra_data: {},
          last_message_at: new Date().toISOString(),
        },
        { onConflict: 'channel_account_id,external_user_id' }
      )
      .select()
      .single()

    if (error || !newSession) {
      console.error('[Coaching] Session creation failed:', error)
      return sendAndReport(channel, 'Désolé, problème technique. Réessayez dans quelques instants.', route)
    }
    session = newSession
  }

  const prompt = `
Tu es l'assistant de prise de rendez-vous d'un coach/professionnel indépendant.
Ton but est de comprendre la demande du client, collecter les informations nécessaires à un RDV, et confirmer poliment.

${customInstructions.length ? `=== INSTRUCTIONS (services proposés, disponibilités, tarifs) ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}
${infosToCollect.length ? `=== INFORMATIONS SUPPLÉMENTAIRES À COLLECTER ===\n${infosToCollect.map((i) => '- ' + i).join('\n')}\n` : ''}

=== ÉTAT ACTUEL DE LA DEMANDE ===
${JSON.stringify(
  {
    desired_service: session.desired_service,
    desired_datetime: session.desired_datetime,
    client_name: session.client_name,
    client_phone: session.client_phone,
    extra_data: session.extra_data,
  },
  null,
  2
)}
${history}
=== MESSAGE DU CLIENT ===
"${fenceUserText(messageText)}"

=== TÂCHES ===
1. Extrais le service souhaité, la date/heure souhaitée (en texte libre, ne cherche pas à normaliser), le nom et le téléphone du client.
2. readyToBook = true UNIQUEMENT si service + date/heure souhaitée + nom + téléphone sont tous connus (dans l'état actuel + ce message) ET que le client vient de confirmer.
3. Si des informations manquent, redemande-les une par une, poliment, dans la langue du client.
4. Si readyToBook = true, remercie le client et indique qu'un membre de l'équipe confirmera le créneau exact rapidement.
5. Évalue ta confiance dans "confidence" (0 à 1) : basse si le message sort du cadre de la prise de RDV, ou si tu n'es pas sûr d'avoir bien compris la demande.

JSON uniquement (sans backticks) :
{
  "extractedData": {
    "desired_service": "... ou null",
    "desired_datetime": "... ou null",
    "client_name": "... ou null",
    "client_phone": "... ou null",
    "extra_data": {}
  },
  "isQuestion": true | false,
  "questionReply": "réponse si le client posait une question, sinon null",
  "readyToBook": true | false,
  "replyText": "le message à envoyer au client",
  "confidence": 0.0
}`

  let llmResult: CoachingLlmResult
  try {
    llmResult = await callAgentLLM<CoachingLlmResult>(prompt, aiProvider, aiApiKey, aiModel)
  } catch (err) {
    console.error('[Coaching] LLM error:', err)
    return { status: 'error', error: err, route }
  }

  const d = llmResult.extractedData ?? {}
  const updates: Record<string, unknown> = { last_message_at: new Date().toISOString() }
  if (d.desired_service) updates.desired_service = d.desired_service
  if (d.desired_datetime) updates.desired_datetime = d.desired_datetime
  if (d.client_name) updates.client_name = d.client_name
  if (d.client_phone) updates.client_phone = d.client_phone
  if (d.extra_data) updates.extra_data = { ...(session.extra_data ?? {}), ...d.extra_data }
  updates.status = llmResult.readyToBook ? 'confirmed' : 'gathering_info'

  await supabase.from('booking_sessions').update(updates).eq('id', session.id)

  if (llmResult.readyToBook) {
    const { data: finalSession } = await supabase.from('booking_sessions').select('*').eq('id', session.id).maybeSingle()
    if (finalSession) {
      await supabase.from('appointments').insert({
        channel_account_id: accountId,
        booking_session_id: finalSession.id,
        client_name: finalSession.client_name ?? 'Inconnu',
        client_phone: finalSession.client_phone ?? null,
        service_name: finalSession.desired_service ?? null,
        status: 'pending',
        notes: finalSession.desired_datetime ? `Créneau souhaité : ${finalSession.desired_datetime}` : null,
      })
    }
  }

  const escalation = await checkConfidenceEscalation(accountId, senderId, channel, llmResult.confidence, route, HUMAN_HANDOFF_TEXT)
  if (escalation) return escalation

  return sendAndReport(channel, llmResult.replyText, route, undefined, llmResult.confidence)
}
