import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function LeadsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Leads" description="Qualification automatique des prospects." />
      <ComingSoon label="Leads" />
    </div>
  )
}
