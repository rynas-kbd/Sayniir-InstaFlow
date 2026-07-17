'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
            <CardTitle className="text-sm">Abonnement</CardTitle>
          </div>
          {status && (
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
              {status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'Inactif'}
            </Badge>
          )}
        </div>
        <CardDescription>
          {expiresAt
            ? `Valide jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : "Gérez votre abonnement Sayniir."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={handleSubscribe} disabled={loading} size="sm">
          {status === 'active' ? 'Renouveler / gérer' : "S'abonner"}
        </Button>
      </CardContent>
    </Card>
  )
}
