import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumeRun } from '@/lib/flows/engine'
import { enqueueRecipients, sendBatch } from '@/lib/campaigns/service'
import { isEncrypted, decryptApiKey } from '@/lib/crypto'
import type { Platform } from '@/lib/channels/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

/**
 * GET /api/admin/flow-runs
 * Cron (daily — Vercel Hobby plan limit) — resumes flow_runs whose delay
 * has elapsed, and sends any campaign whose scheduled_at has passed.
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: dueRuns, error } = await supabase
    .from('flow_runs')
    .select('id, channel_account_id')
    .eq('status', 'waiting')
    .lte('resume_at', now)
    .limit(BATCH_LIMIT)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let resumed = 0
  if (dueRuns && dueRuns.length > 0) {
    const accountIds = Array.from(new Set(dueRuns.map((r) => r.channel_account_id)))
    const [{ data: accounts }, { data: settingsRows }] = await Promise.all([
      supabase.from('channel_accounts').select('id, user_id, access_token, platform').in('id', accountIds),
      supabase.from('agent_settings').select('channel_account_id, ai_provider, ai_api_key, ai_model').in('channel_account_id', accountIds),
    ])

    const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]))
    const settingsMap = new Map((settingsRows ?? []).map((s) => [s.channel_account_id, s]))

    for (const dueRun of dueRuns) {
      const account = accountMap.get(dueRun.channel_account_id)
      if (!account) continue
      const settings = settingsMap.get(dueRun.channel_account_id)

      let apiKey: string | null = settings?.ai_api_key || null
      if (apiKey && isEncrypted(apiKey)) {
        try {
          apiKey = await decryptApiKey(apiKey)
        } catch {
          apiKey = null
        }
      }

      try {
        await resumeRun(
          dueRun.id,
          account.platform as Platform,
          { id: account.id, user_id: account.user_id, access_token: account.access_token },
          { aiProvider: settings?.ai_provider || null, aiApiKey: apiKey, aiModel: settings?.ai_model || null }
        )
        resumed += 1
      } catch (err) {
        console.error(`[flow-runs cron] Failed to resume run ${dueRun.id}:`, err)
      }
    }
  }

  // ── Scheduled campaigns whose time has come ──────────────────────────
  const { data: dueCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(BATCH_LIMIT)

  let campaignsSent = 0
  for (const dueCampaign of dueCampaigns ?? []) {
    try {
      await supabase
        .from('campaigns')
        .update({ status: 'sending', started_at: new Date().toISOString() })
        .eq('id', dueCampaign.id)
      await enqueueRecipients(dueCampaign.id)
      await sendBatch(dueCampaign.id, 1000)
      campaignsSent += 1
    } catch (err) {
      console.error(`[flow-runs cron] Failed to send scheduled campaign ${dueCampaign.id}:`, err)
      await supabase.from('campaigns').update({ status: 'failed' }).eq('id', dueCampaign.id)
    }
  }

  return NextResponse.json({ resumed, campaignsSent })
}
