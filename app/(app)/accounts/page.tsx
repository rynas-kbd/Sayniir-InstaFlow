import { Suspense } from 'react'
import { Camera, CheckCircle2, XCircle, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { ConnectPanel } from '@/components/accounts/connect-panel'
import { ConnectResultToast } from '@/components/accounts/connect-result-toast'
import { AccountCard, type ChannelAccount } from '@/components/accounts/account-card'

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select(
      'id, platform, page_id, page_name, page_picture_url, instagram_username, phone_number, is_active, token_expires_at, connected_at'
    )
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: false })

  const safeAccounts = (accounts ?? []) as ChannelAccount[]
  const activeCount = safeAccounts.filter((a) => a.is_active).length
  const expiredCount = safeAccounts.filter((a) => {
    if (!a.token_expires_at) return false
    return new Date(a.token_expires_at).getTime() <= Date.now()
  }).length

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={null}>
        <ConnectResultToast />
      </Suspense>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Comptes connectés"
          description="Gérez vos comptes Instagram, Messenger et WhatsApp."
          actions={
            <ConnectPanel
              whatsappAppId={process.env.NEXT_PUBLIC_META_WHATSAPP_APP_ID ?? null}
              whatsappConfigId={process.env.META_WHATSAPP_CONFIG_ID ?? null}
            />
          }
        />

        <div className="space-y-5 p-4 md:p-6">
        {safeAccounts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard title="Comptes connectés" value={safeAccounts.length} icon={Link2} />
            <StatCard title="Actifs" value={activeCount} icon={CheckCircle2} />
            <StatCard title="Expirés" value={expiredCount} icon={XCircle} />
          </div>
        )}

        {safeAccounts.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Aucun compte connecté"
            description="Connectez un compte Instagram, Messenger ou WhatsApp pour commencer à automatiser vos conversations."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
