import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/auto-expire
 * Cron job appelé chaque nuit par Vercel.
 * Expire les abonnements dont expires_at est dépassé.
 * Protégé par CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // 1. Trouver les abonnements actifs dont la date est dépassée
  const { data: expiredSubs, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, channel_account_id')
    .eq('status', 'active')
    .lt('expires_at', now)

  if (error) {
    console.error('[AutoExpire] Error fetching subscriptions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expiredSubs || expiredSubs.length === 0) {
    console.log('[AutoExpire] No subscriptions to expire.')
    return NextResponse.json({ expired: 0 })
  }

  const expiredIds = expiredSubs.map((s) => s.id)
  const accountIds = expiredSubs
    .map((s) => s.channel_account_id)
    .filter(Boolean) as string[]

  // 2. Marquer les abonnements comme expirés
  await supabase
    .from('subscriptions')
    .update({ status: 'expired', updated_at: now })
    .in('id', expiredIds)

  // 3. Désactiver les comptes liés
  if (accountIds.length > 0) {
    await supabase
      .from('channel_accounts')
      .update({ is_active: false })
      .in('id', accountIds)
  }

  console.log(`[AutoExpire] ✅ Expired ${expiredSubs.length} subscriptions.`)
  return NextResponse.json({ expired: expiredSubs.length })
}
