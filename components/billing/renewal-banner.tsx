'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getSubscriptionNotice } from '@/lib/billing/expiry'
import type { PlanKey, BillingPeriod } from '@/lib/plans'

interface RenewalBannerProps {
  plan: PlanKey | null
  status: string | null
  expiresAt: string | null
  billingPeriod: BillingPeriod | null
}

/**
 * Chargily has no recurring/auto-charge billing (see
 * app/api/billing/checkout/route.ts) — renewal is always the customer
 * manually relaunching a checkout. This banner is the reminder system
 * standing in for a dunning email flow, shown from J-7 through expiry.
 */
export function RenewalBanner({ plan, status, expiresAt, billingPeriod }: RenewalBannerProps) {
  const [loading, setLoading] = useState(false)
  const notice = getSubscriptionNotice({ status, expiresAt })

  if (!notice.kind || !plan || plan === 'free') return null

  async function handleRenew() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period: billingPeriod ?? 'monthly' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ouvrir le paiement")
      setLoading(false)
    }
  }

  const message =
    notice.kind === 'expired'
      ? 'Votre abonnement a expiré.'
      : notice.daysLeft === 0
        ? "Votre abonnement expire aujourd'hui."
        : `Votre abonnement expire dans ${notice.daysLeft} jour${notice.daysLeft && notice.daysLeft > 1 ? 's' : ''}.`

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-warning/20 bg-warning/10 px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-2 text-xs font-medium text-warning-foreground">
        <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2} />
        {message}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={handleRenew} disabled={loading} className="shrink-0">
        Renouveler
      </Button>
    </div>
  )
}
