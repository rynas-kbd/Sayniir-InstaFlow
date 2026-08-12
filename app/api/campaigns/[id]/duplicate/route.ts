import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Duplicates a campaign into one or more other accounts — never a real
 * multi-account campaign (see the plan's decision): audience_tag_ids/
 * segment_id only mean anything for the account they were picked from, so
 * every copy starts with an empty audience the merchant must reconfigure.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const accountIds: unknown[] = Array.isArray(body.accountIds) ? body.accountIds : []
  if (accountIds.length === 0) return jsonError(400, 'Choisissez au moins un compte')

  // RLS on `campaigns` scopes this select to the caller's own campaign.
  const { data: source, error: sourceError } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle()
  if (sourceError) return jsonError(500, 'Une erreur est survenue', sourceError)
  if (!source) return jsonError(404, 'Campagne introuvable')

  const targetIds = [...new Set(accountIds.filter((v): v is string => typeof v === 'string' && v !== source.channel_account_id))]

  const created: unknown[] = []
  const failed: string[] = []

  for (const channel_account_id of targetIds) {
    const { data: copy, error } = await supabase
      .from('campaigns')
      .insert({
        channel_account_id,
        name: `${source.name} (copie)`,
        message_template: source.message_template,
        status: 'draft',
        response_type: source.response_type ?? 'text',
        card_title: source.card_title ?? null,
        card_subtitle: source.card_subtitle ?? null,
        card_image_url: source.card_image_url ?? null,
        card_buttons: source.card_buttons ?? [],
        // Deliberately not copied — the audience only exists for the source account.
        audience_tag_ids: [],
        segment_id: null,
      })
      .select()
      .single()

    // RLS's WITH CHECK rejects any accountId not owned by the caller — that
    // failure lands here as a per-account skip instead of aborting the
    // whole request over one bad id.
    if (error || !copy) failed.push(channel_account_id)
    else created.push(copy)
  }

  return NextResponse.json({ created, failed })
}
