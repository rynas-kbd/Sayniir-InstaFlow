import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

// POST /api/contacts/[id]/tags — { tag_id, channel_account_id }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const tag_id = body?.tag_id
  const channel_account_id = body?.channel_account_id
  if (!tag_id || !channel_account_id) {
    return NextResponse.json({ error: 'tag_id et channel_account_id sont requis' }, { status: 400 })
  }

  // contact_tags RLS only constrains channel_account_id, which the caller
  // legitimately owns — without this check, id (a foreign contact_id) could
  // point at another tenant's contact.
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', id)
    .eq('channel_account_id', channel_account_id)
    .single()
  if (!contact) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('contact_tags')
    .upsert({ contact_id: id, tag_id, channel_account_id }, { onConflict: 'contact_id,tag_id' })

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true })
}

// DELETE /api/contacts/[id]/tags?tagId=...
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tagId = request.nextUrl.searchParams.get('tagId')
  if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 })

  // Verify the contact belongs to a channel account owned by this user
  // before deleting — contact_tags RLS alone does not gate on contact_id.
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, channel_accounts!inner(user_id)')
    .eq('id', id)
    .eq('channel_accounts.user_id', user.id)
    .single()
  if (!contact) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('contact_tags').delete().eq('contact_id', id).eq('tag_id', tagId)
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true })
}
