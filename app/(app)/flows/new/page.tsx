import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateFlowForm } from '@/components/flows/create-flow-form'

export default async function NewFlowPage() {
  const { active: account } = await resolveActiveAccount()
  if (!account) redirect('/flows')

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Nouveau flow" description="Partez d'un template ou d'une toile vide." />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-lg">
          <Link href="/flows" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour aux flows
          </Link>
          <Card>
            <CardContent className="pt-2">
              <CreateFlowForm channelAccountId={account.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
