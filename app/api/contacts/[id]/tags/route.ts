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
  const { tag_id, channel_account_id } = await request.json()
  if (!tag_id || !channel_account_id) {
    return NextResponse.json({ error: 'tag_id et channel_account_id sont requis' }, { status: 400 })
  }

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

  const { error } = await supabase.from('contact_tags').delete().eq('contact_id', id).eq('tag_id', tagId)
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true })
}
