import { Store, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder shown in place of ShopifyIntegrationPanel — the integration is
// built and functional, but not exposed to users yet.
export function ShopifyComingSoon() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Store className="size-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <p className="flex items-center justify-center gap-1.5 text-[14px] font-semibold text-foreground">
            <Sparkles className="size-3.5 text-primary" /> Intégration Shopify — bientôt disponible
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            La synchronisation automatique de votre catalogue Shopify arrive prochainement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
