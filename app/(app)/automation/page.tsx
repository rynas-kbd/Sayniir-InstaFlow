import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function AutomationPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Règles" description="Réponses automatiques par mot-clé, DM et commentaires." />
      <ComingSoon label="Règles d’automatisation" />
    </div>
  )
}
