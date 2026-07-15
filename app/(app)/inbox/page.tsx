import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function InboxPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Inbox" description="Toutes vos conversations, tous canaux confondus." />
      <ComingSoon label="Inbox unifiée" />
    </div>
  )
}
