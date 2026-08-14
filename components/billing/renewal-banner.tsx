'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getSubscriptionNotice } from '@/lib/billing/expiry'
import type { PlanKey, BillingPeriod } from '@/lib/plans'
import { useT } from '@/components/i18n-provider'

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
  const t = useT()
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
      if (!res.ok) throw new Error(data.error || t('billingBanner.genericError'))
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('billingBanner.openCheckoutError'))
      setLoading(false)
    }
  }

  const message =
    notice.kind === 'expired'
      ? t('billingBanner.expired')
      : notice.daysLeft === 0
        ? t('billingBanner.expiresToday')
        : t.plural('billingBanner.expiresInDays', notice.daysLeft ?? 0)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-warning/20 bg-warning/10 px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-2 text-xs font-medium text-warning-foreground">
        <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2} />
        {message}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={handleRenew} disabled={loading} className="shrink-0">
        {t('billingBanner.renewButton')}
      </Button>
    </div>
  )
}
