import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateCampaignForm } from '@/components/campaigns/create-campaign-form'
import { getT } from '@/lib/i18n/server'

export default async function NewCampaignPage() {
  const t = await getT()
  const supabase = await createClient()
  const { active: account } = await resolveActiveAccount()
  if (!account) redirect('/campaigns')

  const [{ data: tags }, { data: segments }] = await Promise.all([
    supabase.from('tags').select('*').eq('channel_account_id', account.id).order('name'),
    supabase.from('segments').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t('campaigns.newPage.title')} description={t('campaigns.newPage.description')} />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> {t('campaigns.newPage.backLink')}
          </Link>
          <CreateCampaignForm channelAccountId={account.id} tags={tags ?? []} segments={segments ?? []} />
        </div>
      </div>
    </div>
  )
}
