import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAudience, resolveSegment } from '@/lib/contacts/service'

// POST /api/campaigns/audience-preview — live audience count while creating/editing a campaign,
// before the campaign row exists. Body: { channelAccountId, tagIds, segmentId }.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { channelAccountId, tagIds, segmentId } = body
  if (!channelAccountId) return NextResponse.json({ error: 'channelAccountId requis' }, { status: 400 })

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channelAccountId).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const contactIds = segmentId ? await resolveSegment(channelAccountId, segmentId) : await resolveAudience(channelAccountId, tagIds ?? [])
  return NextResponse.json({ count: contactIds.length })
}
