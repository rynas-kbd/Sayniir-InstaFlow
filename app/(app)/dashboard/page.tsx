import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Dashboard" description="Vue d’ensemble de votre activité." />
      <ComingSoon label="Dashboard" />
    </div>
  )
}
