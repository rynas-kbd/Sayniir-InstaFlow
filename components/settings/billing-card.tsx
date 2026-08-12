'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, Wallet, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormSection } from '@/components/shared/form-section'
import { cn } from '@/lib/utils'
import { PLAN_CONFIG, PLAN_KEYS, formatDzd, type PlanKey, type BillingPeriod } from '@/lib/plans'

const PURCHASABLE_PLANS = PLAN_KEYS.filter((k) => k !== 'free')

/**
 * Reads the ?billing=success|failed param left by the Chargily success_url /
 * failure_url redirect and surfaces it as a toast — useSearchParams() must
 * live inside its own Suspense boundary or it opts the whole page out of
 * static rendering (same pattern as ConnectResultToast).
 */
function BillingStatusToast() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const billing = searchParams.get('billing')
    if (billing === 'success') {
      toast.success('Paiement reçu — votre abonnement est actif.')
      router.replace('/settings')
    } else if (billing === 'failed') {
      toast.error('Le paiement a échoué ou a été annulé.')
      router.replace('/settings')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}

interface BillingCardProps {
  plan: PlanKey | null
  status: 'active' | 'inactive' | 'expired' | null
  expiresAt: string | null
  customPriceMonthlyDzd: number | null
  customPriceAnnualDzd: number | null
}

export function BillingCard({ plan, status, expiresAt, customPriceMonthlyDzd, customPriceAnnualDzd }: BillingCardProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(plan && plan !== 'free' ? plan : 'starter')
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  const isBusinessSelected = selectedPlan === 'business'
  const businessAmount = period === 'annual' ? customPriceAnnualDzd : customPriceMonthlyDzd
  const businessPriceMissing = isBusinessSelected && !businessAmount

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, period }),
      })
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
      <Suspense fallback={null}>
        <BillingStatusToast />
      </Suspense>
      <CardContent className="space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Abonnement</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Gérez votre abonnement Instaflow.</p>
          </div>
        </div>

        <FormSection icon={Wallet} label="Statut">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {status && (
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mb-1.5">
                  {plan && plan !== 'free' ? `${PLAN_CONFIG[plan].label} — ` : ''}
                  {status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'Inactif'}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {expiresAt
                  ? `Valide jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : 'Aucun abonnement actif.'}
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection icon={CreditCard} label="Choisir un plan">
          <div className="grid gap-2 sm:grid-cols-3">
            {PURCHASABLE_PLANS.map((key) => {
              const cfg = PLAN_CONFIG[key]
              const isSelected = key === selectedPlan
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    'relative flex flex-col rounded-xl border-2 p-2.5 text-left transition-colors',
                    isSelected ? cn(cfg.borderClass, 'bg-primary/3') : 'border-border hover:border-primary/30'
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-2.5" strokeWidth={3} />
                    </div>
                  )}
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="mt-0.5 text-sm font-semibold text-foreground">
                    {cfg.priceMonthlyDzd === null
                      ? 'Sur devis'
                      : `${formatDzd(period === 'annual' ? cfg.priceAnnualDzd! : cfg.priceMonthlyDzd)} DZD`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{period === 'annual' ? '/an' : '/mois'}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={cn(
                'flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                period === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setPeriod('annual')}
              className={cn(
                'flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                period === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Annuel <span className="text-success">−20%</span>
            </button>
          </div>

          {businessPriceMissing ? (
            <p className="text-xs text-muted-foreground">
              Votre tarif Business n&apos;a pas encore été défini. Contactez-nous pour l&apos;obtenir.
            </p>
          ) : (
            <Button type="button" onClick={handleSubscribe} disabled={loading} size="sm" className="w-full">
              {status === 'active' ? 'Renouveler' : "S'abonner"}
            </Button>
          )}
        </FormSection>
      </CardContent>
    </Card>
  )
}
