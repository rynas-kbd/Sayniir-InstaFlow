import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function FlowsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Flows" description="Automatisations visuelles par flux de conversation." />
      <ComingSoon label="Flow Builder" />
    </div>
  )
}
