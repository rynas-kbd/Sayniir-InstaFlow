import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateCampaignForm } from '@/components/campaigns/create-campaign-form'

export default async function NewCampaignPage() {
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
  if (!account) redirect('/campaigns')

  const [{ data: tags }, { data: segments }] = await Promise.all([
    supabase.from('tags').select('*').eq('channel_account_id', account.id).order('name'),
    supabase.from('segments').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Nouvelle campagne" description="Diffusez un message à une audience ciblée." />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour aux campagnes
          </Link>
          <CreateCampaignForm channelAccountId={account.id} tags={tags ?? []} segments={segments ?? []} />
        </div>
      </div>
    </div>
  )
}
