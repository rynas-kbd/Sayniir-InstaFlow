import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function CampaignsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Campagnes" description="Diffusions ciblées vers vos contacts et segments." />
      <ComingSoon label="Campagnes & Broadcast" />
    </div>
  )
}
