import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateProductPageForm } from '@/components/boutique/create-product-page-form'

export default async function NewProductPage() {
  const { active: account } = await resolveActiveAccount()
  if (!account) redirect('/boutique')

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Nouveau produit" description="Renseignez les informations affichées à vos clients." />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <Link href="/boutique" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour à la boutique
          </Link>
          <CreateProductPageForm channelAccountId={account.id} />
        </div>
      </div>
    </div>
  )
}
