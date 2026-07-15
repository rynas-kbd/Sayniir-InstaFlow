import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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

      <div className="p-4 sm:p-6">
        {safeAccounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <Camera className="size-8 text-muted-foreground/50" strokeWidth={1} />
            <p className="text-sm font-medium text-foreground">Aucun compte connecté</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Connectez un compte Instagram, Messenger ou WhatsApp pour commencer à automatiser vos
              conversations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {safeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
