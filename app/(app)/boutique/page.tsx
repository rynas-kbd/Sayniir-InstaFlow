import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { decryptApiKey, isEncrypted } from '@/lib/crypto'
import { PageHeader } from '@/components/app-shell/page-header'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { BoutiqueClient } from '@/components/boutique/boutique-client'
import type { AgentSettings } from '@/components/boutique/types'

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

  const [{ data: products }, { data: orders }, { data: rawSettings }] = await Promise.all([
    supabase.from('products').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('agent_settings').select('*').eq('channel_account_id', account.id).maybeSingle(),
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


  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 p-4 sm:p-6">
        <BoutiqueClient
          channelAccountId={account.id}
          products={products ?? []}
          orders={orders ?? []}
          agentSettings={agentSettings}
        />
      </div>
    </div>
  )
}
