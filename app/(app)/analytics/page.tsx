import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Analytics" description="Performance de vos automatisations et conversations." />
      <ComingSoon label="Analytics" />
    </div>
  )
}
