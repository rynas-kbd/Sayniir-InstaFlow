'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormSection } from '@/components/shared/form-section'

interface BillingCardProps {
  status: 'active' | 'inactive' | 'expired' | null
  expiresAt: string | null
}

export function BillingCard({ status, expiresAt }: BillingCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ouvrir le paiement")
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Abonnement</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Gérez votre abonnement Sayniir.</p>
          </div>
        </div>

        <FormSection icon={Wallet} label="Statut">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {status && (
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mb-1.5">
                  {status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'Inactif'}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {expiresAt
                  ? `Valide jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : 'Aucun abonnement actif.'}
              </p>
            </div>
            <Button type="button" onClick={handleSubscribe} disabled={loading} size="sm" className="shrink-0">
              {status === 'active' ? 'Renouveler / gérer' : "S'abonner"}
            </Button>
          </div>
        </FormSection>
      </CardContent>
    </Card>
  )
}
