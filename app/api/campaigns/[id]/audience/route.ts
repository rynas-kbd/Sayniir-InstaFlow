import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAudience } from '@/lib/contacts/service'

// GET /api/campaigns/[id]/audience — preview count for the current audience_tag_ids
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: campaign } = await supabase.from('campaigns').select('channel_account_id, audience_tag_ids').eq('id', id).single()
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const contactIds = await resolveAudience(campaign.channel_account_id, campaign.audience_tag_ids ?? [])
  return NextResponse.json({ count: contactIds.length })
}
