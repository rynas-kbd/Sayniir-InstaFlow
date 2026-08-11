import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { decryptApiKey, isEncrypted } from '@/lib/crypto'
import { PageHeader } from '@/components/app-shell/page-header'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { BoutiqueClient } from '@/components/boutique/boutique-client'
import type { AgentSettings, AbandonedSession } from '@/components/boutique/types'

export default async function BoutiquePage() {
  const supabase = await createClient()
  const { active: account } = await resolveActiveAccount()

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Boutique" description="Catalogue produits et commandes." />
        <NoAccountState description="Connectez un compte pour commencer à gérer votre boutique." />
      </div>
    )
  }

  // A session not confirmed/cancelled and stale (no message in 2h) is a
  // ready-made abandoned-cart signal — order_sessions already tracks exactly
  // this, it was just never surfaced anywhere.
  const abandonedThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const [{ data: products }, { data: orders }, { data: rawSettings }, { count: sessionsTotal }, { data: abandonedSessions }, { data: discountCodes }] =
    await Promise.all([
      // Bounded — this used to fetch every row unconditionally. 300 is
      // generous for a single merchant's catalog/order history; the list UI
      // (search/filter/pagination in product-table.tsx/order-table.tsx)
      // operates client-side over this set. A merchant beyond this volume
      // needs real server-side pagination, not addressed here.
      supabase.from('products').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }).limit(300),
      supabase
        .from('orders')
        .select('*, contact:contacts(id, full_name, username)')
        .eq('channel_account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(300),
      supabase.from('agent_settings').select('*').eq('channel_account_id', account.id).maybeSingle(),
      supabase.from('order_sessions').select('id', { count: 'exact', head: true }).eq('channel_account_id', account.id),
      supabase
        .from('order_sessions')
        .select('id, sender_id, customer_name, status, last_message_at, products(name)')
        .eq('channel_account_id', account.id)
        .not('status', 'in', '(confirmed,cancelled)')
        .lt('last_message_at', abandonedThreshold)
        .order('last_message_at', { ascending: false })
        .limit(50),
      supabase.from('discount_codes').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    ])

  let apiKey = rawSettings?.ai_api_key ?? ''
  if (apiKey && isEncrypted(apiKey)) {
    try {
      apiKey = await decryptApiKey(apiKey)
    } catch {
      apiKey = ''
    }
  }
  if (apiKey) apiKey = '••••••••••••'

  const agentSettings: AgentSettings = {
    channel_account_id: account.id,
    is_qa_active: rawSettings?.is_qa_active ?? false,
    is_order_taking_active: rawSettings?.is_order_taking_active ?? false,
    ai_provider: rawSettings?.ai_provider ?? 'openrouter',
    ai_api_key: apiKey,
    ai_model: rawSettings?.ai_model ?? 'nvidia/nemotron-3-ultra-550b-a55b:free',
    instructions: rawSettings?.instructions ?? [],
    infos_to_collect: rawSettings?.infos_to_collect ?? [],
    vertical_config: rawSettings?.vertical_config ?? {},
  }


  const safeOrders = orders ?? []
  const revenue = safeOrders.reduce((sum, o) => sum + o.total_amount, 0)
  const confirmedCount = safeOrders.length
  const aov = confirmedCount > 0 ? revenue / confirmedCount : 0
  const conversionRate = sessionsTotal && sessionsTotal > 0 ? (confirmedCount / sessionsTotal) * 100 : null

  const productTotals = new Map<string, number>()
  for (const o of safeOrders) {
    productTotals.set(o.product_name, (productTotals.get(o.product_name) ?? 0) + o.quantity)
  }
  const topProducts = Array.from(productTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, quantity]) => ({ name, quantity }))

  const stats = { revenue, aov, conversionRate, topProducts }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <BoutiqueClient
          channelAccountId={account.id}
          products={products ?? []}
          orders={safeOrders}
          agentSettings={agentSettings}
          stats={stats}
          abandonedSessions={(abandonedSessions ?? []) as unknown as AbandonedSession[]}
          discountCodes={discountCodes ?? []}
        />
      </div>
    </div>
  )
}
