import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueRecipients, sendBatch } from '@/lib/campaigns/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SEND_LIMIT_PER_CAMPAIGN = 50

/**
 * GET /api/admin/campaign-dispatch
 * Cron (every 2 minutes) — promotes due scheduled campaigns, then sends a
 * bounded batch for every campaign currently in 'sending'. Protected by
 * CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: due } = await supabase.from('campaigns').select('id').eq('status', 'scheduled').lte('scheduled_at', now)
  for (const campaign of due ?? []) {
    await supabase.from('campaigns').update({ status: 'sending', started_at: now }).eq('id', campaign.id)
    await enqueueRecipients(campaign.id)
  }

  const { data: sending } = await supabase.from('campaigns').select('id').eq('status', 'sending')

  let totalSent = 0
  for (const campaign of sending ?? []) {
    try {
      const result = await sendBatch(campaign.id, SEND_LIMIT_PER_CAMPAIGN)
      totalSent += result.sent
    } catch (err) {
      console.error(`[campaign-dispatch cron] Failed batch for campaign ${campaign.id}:`, err)
    }
  }

  return NextResponse.json({ promoted: due?.length ?? 0, processed: sending?.length ?? 0, sent: totalSent })
}
