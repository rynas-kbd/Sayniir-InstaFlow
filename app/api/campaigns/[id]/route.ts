import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id] — with send stats
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: campaign, error } = await supabase.from('campaigns').select('*').eq('id', id).single()
  if (error || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const { data: sends } = await supabase.from('campaign_sends').select('status').eq('campaign_id', id)
  const counts = { pending: 0, sent: 0, failed: 0, skipped_window: 0, skipped_unsubscribed: 0 }
  for (const s of sends ?? []) {
    counts[s.status as keyof typeof counts] = (counts[s.status as keyof typeof counts] ?? 0) + 1
  }

  return NextResponse.json({ ...campaign, sendCounts: counts })
}

import { enqueueRecipients, sendBatch } from '@/lib/campaigns/service'

// PATCH /api/campaigns/[id] — schedule/cancel/update
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const allowed = ['name', 'message_template', 'audience_tag_ids', 'status', 'scheduled_at']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // If launching the campaign
  const isLaunching = updates.status === 'scheduled'

  if (isLaunching) {
    updates.status = 'sending'
    updates.started_at = new Date().toISOString()
  }

  const { data: campaign, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single()
  if (error || !campaign) return NextResponse.json({ error: error?.message || 'Campaign not found' }, { status: 500 })

  if (isLaunching) {
    try {
      // 1. Enqueue all matching contacts
      await enqueueRecipients(id)

      // 2. Immediately send the messages to the enqueued contacts
      // Limit to 1000 sends to run safely in one request
      await sendBatch(id, 1000)

      // 3. Fetch final campaign status
      const { data: finalCampaign } = await supabase.from('campaigns').select('*').eq('id', id).single()
      return NextResponse.json(finalCampaign || campaign)
    } catch (err) {
      console.error('[PATCH campaign:launch] Failed to process campaign dispatch:', err)
      // Fallback update status to failed
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', id)
      return NextResponse.json({ ...campaign, status: 'failed' })
    }
  }

  return NextResponse.json(campaign)
}

// DELETE /api/campaigns/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
