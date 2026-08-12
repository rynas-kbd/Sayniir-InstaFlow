import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/rules/[id] — update a rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  // Only allow updating safe fields. channel_account_id WAS missing here —
  // that made the "Compte" picker in the edit dialog a no-op (it showed
  // "Règle mise à jour" but never actually moved the rule). Safe to include:
  // RLS's WITH CHECK on automation_rules rejects a new value the caller
  // doesn't own, same as it already does for INSERT.
  const allowed = [
    'channel_account_id',
    'name',
    'trigger_type',
    'trigger_keywords',
    'response_text',
    'is_active',
    'target_post_ids',
    'reply_method',
    'response_text_dm',
    'response_type',
    'card_title',
    'card_subtitle',
    'card_image_url',
    'card_buttons',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  const { data: rule, error } = await supabase
    .from('automation_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)

  let targetAccountIds: string[] | undefined
  if (Array.isArray(body.target_account_ids)) {
    const rawIds: unknown[] = body.target_account_ids
    const filtered: string[] = rawIds.filter((v): v is string => typeof v === 'string' && v !== rule.channel_account_id)
    targetAccountIds = [...new Set(filtered)]
    const { error: deleteError } = await supabase.from('rule_target_accounts').delete().eq('rule_id', id)
    if (deleteError) return jsonError(500, 'Une erreur est survenue', deleteError)
    if (targetAccountIds.length > 0) {
      const { error: insertError } = await supabase
        .from('rule_target_accounts')
        .insert(targetAccountIds.map((channel_account_id) => ({ rule_id: id, channel_account_id })))
      if (insertError) return jsonError(500, 'Un ou plusieurs comptes sélectionnés sont invalides', insertError)
    }
  }

  return NextResponse.json(targetAccountIds !== undefined ? { ...rule, target_account_ids: targetAccountIds } : rule)
}

// DELETE /api/rules/[id] — delete a rule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id)

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true })
}
