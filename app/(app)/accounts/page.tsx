import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { ConnectPanel } from '@/components/accounts/connect-panel'
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Comptes connectés"
        description={`${activeCount} compte${activeCount !== 1 ? 's' : ''} actif${activeCount !== 1 ? 's' : ''} sur ${safeAccounts.length} connecté${safeAccounts.length !== 1 ? 's' : ''}`}
        actions={<ConnectPanel />}
      />

      <div className="p-4 md:p-6">
        {safeAccounts.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Aucun compte connecté"
            description="Connectez un compte Instagram, Messenger ou WhatsApp pour commencer à automatiser vos conversations."
          />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {safeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
