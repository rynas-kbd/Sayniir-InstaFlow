import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumeRun } from '@/lib/flows/engine'
import { isEncrypted, decryptApiKey } from '@/lib/crypto'
import type { Platform } from '@/lib/channels/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

/**
 * GET /api/admin/flow-runs
 * Cron (every minute) — resumes flow_runs whose delay has elapsed.
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
  if (!dueRuns || dueRuns.length === 0) return NextResponse.json({ resumed: 0 })

  const accountIds = Array.from(new Set(dueRuns.map((r) => r.channel_account_id)))
  const [{ data: accounts }, { data: settingsRows }] = await Promise.all([
    supabase.from('channel_accounts').select('id, user_id, access_token, platform').in('id', accountIds),
    supabase.from('agent_settings').select('channel_account_id, ai_provider, ai_api_key, ai_model').in('channel_account_id', accountIds),
  ])

  const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]))
  const settingsMap = new Map((settingsRows ?? []).map((s) => [s.channel_account_id, s]))

  let resumed = 0
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

  return NextResponse.json({ resumed })
}
