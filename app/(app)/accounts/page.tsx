import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function AccountsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Comptes connectés" description="Instagram, Messenger et WhatsApp." />
      <ComingSoon label="Gestion des comptes" />
    </div>
  )
}
