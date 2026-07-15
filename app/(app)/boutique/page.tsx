import { PageHeader } from '@/components/app-shell/page-header'
import { ComingSoon } from '@/components/app-shell/coming-soon'

export default function BoutiquePage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Boutique" description="Catalogue produits et commandes." />
      <ComingSoon label="Boutique e-commerce" />
    </div>
  )
}
