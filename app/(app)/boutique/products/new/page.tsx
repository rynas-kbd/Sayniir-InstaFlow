import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/app-shell/page-header'
import { CreateProductPageForm } from '@/components/boutique/create-product-page-form'

export default async function NewProductPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: true })

  const account = accounts?.[0]
  if (!account) redirect('/boutique')

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Nouveau produit" description="Renseignez les informations affichées à vos clients." />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-lg">
          <Link href="/boutique" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour à la boutique
          </Link>
          <Card>
            <CardContent className="pt-2">
              <CreateProductPageForm channelAccountId={account.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
