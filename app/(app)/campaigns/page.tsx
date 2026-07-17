import { Megaphone, Rocket, CheckCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import { StatCard } from '@/components/dashboard/stat-card'
import type { Campaign } from '@/components/campaigns/types'

export default async function CampaignsPage() {
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
        <PageHeader title="Campagnes" description="Diffusions ciblées vers vos contacts et segments." />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={Megaphone}
            title="Aucun compte connecté"
            description="Connectez un compte pour lancer des campagnes."
          />
        </div>
      </div>
    )
  }

  const [{ data: campaigns }, { data: tags }, { data: segments }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('tags').select('*').eq('channel_account_id', account.id).order('name'),
    supabase.from('segments').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
  ])

  const safeCampaigns = (campaigns ?? []) as Campaign[]

  const sendCountsByCampaign = new Map<string, { sent: number; pending: number; failed: number }>()
  if (safeCampaigns.length > 0) {
    const { data: sends } = await supabase
      .from('campaign_sends')
      .select('campaign_id, status')
      .in(
        'campaign_id',
        safeCampaigns.map((c) => c.id)
      )
    for (const send of sends ?? []) {
      const counts = sendCountsByCampaign.get(send.campaign_id) ?? { sent: 0, pending: 0, failed: 0 }
      if (send.status === 'sent') counts.sent += 1
      else if (send.status === 'pending') counts.pending += 1
      else if (send.status === 'failed') counts.failed += 1
      sendCountsByCampaign.set(send.campaign_id, counts)
    }
  }

  // Calculate high-level summary metrics
  const totalCampaigns = safeCampaigns.length
  const draftCampaigns = safeCampaigns.filter((c) => c.status === 'draft').length
  const sentCampaigns = safeCampaigns.filter((c) => c.status === 'sent').length
  const failedCampaigns = safeCampaigns.filter((c) => c.status === 'failed').length

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Campagnes"
        description="Diffusions ciblées vers vos contacts et segments."
        actions={<CreateCampaignDialog channelAccountId={account.id} tags={tags ?? []} segments={segments ?? []} />}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Campaign Metrics Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="Campagnes totales" value={totalCampaigns} />
          <StatCard title="Brouillons" value={draftCampaigns} />
          <StatCard title="Envoyées" value={sentCampaigns} />
          <StatCard title="Échecs" value={failedCampaigns} />
        </div>

        {safeCampaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description="Créez votre première diffusion ciblée pour envoyer des messages de masse à vos segments."
            action={<CreateCampaignDialog channelAccountId={account.id} tags={tags ?? []} segments={segments ?? []} />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                sendCounts={sendCountsByCampaign.get(campaign.id) ?? { sent: 0, pending: 0, failed: 0 }}
              />
            ))}
            
            {/* Create new campaign card button in the grid */}
            <CreateCampaignDialog channelAccountId={account.id} tags={tags ?? []} segments={segments ?? []} asCard />
          </div>
        )}
      </div>
    </div>
  )
}
