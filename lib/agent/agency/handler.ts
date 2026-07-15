import { createAdminClient } from '../../supabase/admin'
import { sendReply, TokenExpiredError } from '../../meta/messaging'
import { callAgentLLM } from '../engine'

/**
 * Agency vertical — lead qualification agent. New build. Unlike ecommerce's
 * checkout-style session/order pair, a lead is a single evolving record
 * (leads table) — qualification_status progresses new → qualifying →
 * qualified/disqualified as the conversation continues.
 */

interface AgencyLlmResult {
  extractedData: {
    full_name?: string | null
    phone?: string | null
    email?: string | null
    budget_range?: string | null
    need_summary?: string | null
  }
  qualificationStatus: 'new' | 'qualifying' | 'qualified' | 'disqualified'
  score: number
  replyText: string
}

export async function handleAgencyMessage({
  accountId,
  pageId,
  senderId,
  messageText,
  accessToken,
  customInstructions = [],
  infosToCollect = [],
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string
  pageId: string
  senderId: string
  messageText: string
  accessToken: string
  customInstructions?: string[]
  infosToCollect?: string[]
  aiProvider?: string | null
  aiApiKey?: string | null
  aiModel?: string | null
}): Promise<void> {
  const supabase = createAdminClient()

  let { data: lead } = await supabase.from('leads').select('*').eq('channel_account_id', accountId).eq('external_user_id', senderId).single()

  if (!lead) {
    const { data: newLead, error } = await supabase
      .from('leads')
      .upsert(
        { channel_account_id: accountId, external_user_id: senderId, qualification_status: 'new', extra_data: {}, last_message_at: new Date().toISOString() },
        { onConflict: 'channel_account_id,external_user_id' }
      )
      .select()
      .single()

    if (error || !newLead) {
      console.error('[Agency] Lead creation failed:', error)
      await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
      return
    }
    lead = newLead
  }

  const prompt = `
Tu es l'assistant de qualification de prospects d'une agence.
Ton but est de comprendre le besoin du prospect et de collecter les informations de qualification, de manière naturelle et chaleureuse.

${customInstructions.length ? `=== CRITÈRES DE QUALIFICATION / SERVICES DE L'AGENCE ===\n${customInstructions.map((i) => '- ' + i).join('\n')}\n` : ''}
${infosToCollect.length ? `=== INFORMATIONS SUPPLÉMENTAIRES À COLLECTER ===\n${infosToCollect.map((i) => '- ' + i).join('\n')}\n` : ''}

=== ÉTAT ACTUEL DU LEAD ===
${JSON.stringify(
  { full_name: lead.full_name, phone: lead.phone, email: lead.email, budget_range: lead.budget_range, need_summary: lead.need_summary, qualification_status: lead.qualification_status },
  null,
  2
)}

=== MESSAGE DU PROSPECT ===
"${messageText}"

=== TÂCHES ===
1. Extrais nom, téléphone, email, budget approximatif, résumé du besoin si mentionnés.
2. Détermine qualificationStatus :
   - "new" : conversation qui démarre, rien de qualifiant encore
   - "qualifying" : en cours de collecte
   - "qualified" : besoin + budget cohérents avec les critères de l'agence
   - "disqualified" : hors cible (budget/besoin incompatible avec les critères ci-dessus)
3. Donne un score de 0 à 100 reflétant la qualité du lead.
4. Réponds au prospect de façon naturelle, en posant la prochaine question de qualification pertinente si besoin.

JSON uniquement (sans backticks) :
{
  "extractedData": { "full_name": "... ou null", "phone": "... ou null", "email": "... ou null", "budget_range": "... ou null", "need_summary": "... ou null" },
  "qualificationStatus": "new" | "qualifying" | "qualified" | "disqualified",
  "score": 0,
  "replyText": "le message à envoyer au prospect"
}`

  let llmResult: AgencyLlmResult
  try {
    llmResult = await callAgentLLM<AgencyLlmResult>(prompt, aiProvider, aiApiKey, aiModel)
  } catch (err) {
    console.error('[Agency] LLM error:', err)
    await sendReply(pageId, accessToken, senderId, 'Désolé, problème technique. Réessayez dans quelques instants.')
    return
  }

  const d = llmResult.extractedData ?? {}
  const updates: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
    qualification_status: llmResult.qualificationStatus ?? lead.qualification_status,
    score: typeof llmResult.score === 'number' ? llmResult.score : lead.score,
  }
  if (d.full_name) updates.full_name = d.full_name
  if (d.phone) updates.phone = d.phone
  if (d.email) updates.email = d.email
  if (d.budget_range) updates.budget_range = d.budget_range
  if (d.need_summary) updates.need_summary = d.need_summary

  await supabase.from('leads').update(updates).eq('id', lead.id)

  try {
    await sendReply(pageId, accessToken, senderId, llmResult.replyText)
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await supabase.from('channel_accounts').update({ is_active: false }).eq('id', accountId)
    }
    console.error('[Agency] sendReply failed:', err)
  }
}
