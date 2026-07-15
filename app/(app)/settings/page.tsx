import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Paramètres" description="Compte, abonnement et préférences." />
      <ComingSoon label="Paramètres" />
    </div>
  )
}
