import { Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { decryptApiKey, isEncrypted } from '@/lib/crypto'
import { PageHeader } from '@/components/app-shell/page-header'
import { BoutiqueClient } from '@/components/boutique/boutique-client'
import type { AgentSettings } from '@/components/boutique/types'

export default async function BoutiquePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: true })

  const account = accounts?.[0]

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Boutique" description="Catalogue produits et commandes." />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Store className="size-8 text-muted-foreground/50" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground">Aucun compte connecté</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Connectez un compte pour commencer à gérer votre boutique.
          </p>
        </div>
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
    ai_provider: rawSettings?.ai_provider ?? 'gemini',
    ai_api_key: apiKey,
    ai_model: rawSettings?.ai_model ?? 'gemini-1.5-flash',
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Boutique" description="Catalogue produits, commandes et configuration IA." />
      <div className="p-4 sm:p-6">
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
