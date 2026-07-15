import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function ContactsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Contacts" description="Votre CRM : contacts, tags et historique." />
      <ComingSoon label="CRM Contacts & Tags" />
    </div>
  )
}
