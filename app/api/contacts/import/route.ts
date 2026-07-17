import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const KNOWN_COLUMNS = new Set(['full_name', 'username', 'phone', 'email', 'tags'])

// POST /api/contacts/import — { channel_account_id, rows: Record<string,string>[] }
// Matches existing contacts by phone or email; unmatched rows are skipped
// (imported contacts have no real sender_id, so they couldn't receive
// messages anyway — this is a bulk-enrichment tool, not a contact creator).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, rows } = body as { channel_account_id: string; rows: Record<string, string>[] }
  if (!channel_account_id || !Array.isArray(rows)) {
    return NextResponse.json({ error: 'channel_account_id et rows sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channel_account_id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: existingTags } = await supabase.from('tags').select('*').eq('channel_account_id', channel_account_id)
  const tagByName = new Map((existingTags ?? []).map((t) => [t.name.toLowerCase(), t]))

  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const phone = row.phone?.trim()
    const email = row.email?.trim()
    if (!phone && !email) {
      skipped += 1
      continue
    }

    let query = supabase.from('contacts').select('id, custom_fields').eq('channel_account_id', channel_account_id)
    query = phone ? query.eq('phone', phone) : query.eq('email', email!)
    const { data: contact } = await query.maybeSingle()

    if (!contact) {
      skipped += 1
      continue
    }

    const customFields: Record<string, string> = { ...(contact.custom_fields ?? {}) }
    for (const [key, value] of Object.entries(row)) {
      if (!KNOWN_COLUMNS.has(key) && value) customFields[key] = value
    }

    const updates: Record<string, unknown> = { custom_fields: customFields }
    if (row.full_name) updates.full_name = row.full_name

    await supabase.from('contacts').update(updates).eq('id', contact.id)

    const tagNames = (row.tags ?? '')
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean)
    for (const tagName of tagNames) {
      let tag = tagByName.get(tagName.toLowerCase())
      if (!tag) {
        const { data: created } = await supabase
          .from('tags')
          .insert({ channel_account_id, name: tagName })
          .select()
          .single()
        if (created) {
          tag = created
          tagByName.set(tagName.toLowerCase(), created)
        }
      }
      if (tag) {
        await supabase
          .from('contact_tags')
          .upsert({ contact_id: contact.id, tag_id: tag.id, channel_account_id }, { onConflict: 'contact_id,tag_id' })
      }
    }

    updated += 1
  }

  return NextResponse.json({ updated, skipped })
}
