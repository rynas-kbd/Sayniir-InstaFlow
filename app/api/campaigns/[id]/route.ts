import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/api/rate-limit'

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

// PATCH /api/campaigns/[id] — schedule/cancel/update/relaunch
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return jsonError(400, 'Corps de requête invalide')

  const VALID_STATUSES = new Set(['draft', 'scheduled', 'sending', 'sent', 'cancelled'])
  if ('status' in body && !VALID_STATUSES.has(body.status)) {
    return jsonError(400, 'status invalide')
  }

  const allowed = [
    'name',
    'message_template',
    'audience_tag_ids',
    'segment_id',
    'status',
    'scheduled_at',
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

  // Flag: launching OR re-launching
  const isLaunching = updates.status === 'scheduled'
  const isRelaunching = body.relaunch === true

  // relaunch wipes campaign_sends and resends to the whole audience — bound
  // how often that can be triggered per campaign to stop a resend loop.
  if (isRelaunching) {
    const rl = checkRateLimit(`campaigns:relaunch:${id}`, 3, 5 * 60_000)
    if (!rl.allowed) return jsonError(429, 'Cette campagne a déjà été relancée récemment, réessayez plus tard')
  }

  if (isLaunching || isRelaunching) {
    updates.status = 'sending'
    updates.started_at = new Date().toISOString()
    updates.completed_at = null
  }

  const { data: campaign, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single()
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!campaign) return jsonError(404, 'Campagne introuvable')

  if (isLaunching || isRelaunching) {
    try {
      // If re-launching: wipe existing sends so they don't block re-enqueueing
      if (isRelaunching) {
        await supabase.from('campaign_sends').delete().eq('campaign_id', id)
      }

      // 1. Enqueue all matching contacts
      await enqueueRecipients(id)

      // 2. Immediately send — limit to 1000 per request
      await sendBatch(id, 1000)

      // 3. Fetch final campaign status
      const { data: finalCampaign } = await supabase.from('campaigns').select('*').eq('id', id).single()
      return NextResponse.json(finalCampaign || campaign)
    } catch (err) {
      console.error('[PATCH campaign:launch] Failed to process campaign dispatch:', err)
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
  const { data: deleted, error } = await supabase.from('campaigns').delete().eq('id', id).select('id')
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  if (!deleted || deleted.length === 0) return jsonError(404, 'Campagne introuvable')
  return NextResponse.json({ success: true })
}
