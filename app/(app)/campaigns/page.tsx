import Link from 'next/link'
import { Megaphone, Rocket, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import { StatCard } from '@/components/dashboard/stat-card'
import type { Campaign } from '@/components/campaigns/types'
import { mapAiInsightRow, type AiInsight } from '@/components/ai/types'

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

  const [{ data: campaigns }, { data: insightRows }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
    supabase
      .from('ai_insights')
      .select('id, rule_id, scope, subject_id, severity, title, detail, fix_tool_name, fix_tool_input')
      .eq('channel_account_id', account.id)
      .eq('scope', 'campaign')
      .is('dismissed_at', null),
  ])

  const safeCampaigns = (campaigns ?? []) as Campaign[]

  const insightsByCampaignId = new Map<string, AiInsight[]>()
  for (const row of insightRows ?? []) {
    const insight = mapAiInsightRow(row)
    const list = insightsByCampaignId.get(insight.subjectId) ?? []
    list.push(insight)
    insightsByCampaignId.set(insight.subjectId, list)
  }

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
        actions={
          <Button render={<Link href="/campaigns/new" />}>
            <Plus className="size-4" />
            Nouvelle campagne
          </Button>
        }
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
            action={
              <Button render={<Link href="/campaigns/new" />}>
                <Plus className="size-4" />
                Nouvelle campagne
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                sendCounts={sendCountsByCampaign.get(campaign.id) ?? { sent: 0, pending: 0, failed: 0 }}
                insights={insightsByCampaignId.get(campaign.id) ?? []}
              />
            ))}
            
            {/* Create new campaign card button in the grid */}
            <Link
              href="/campaigns/new"
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
                <Plus className="size-5" />
              </div>
              <span className="text-sm font-medium">Nouvelle campagne</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
