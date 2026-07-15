import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function RdvPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Rendez-vous" description="Prises de rendez-vous automatisées par l’IA." />
      <ComingSoon label="Rendez-vous" />
    </div>
  )
}
