'use client'

import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { toast } from 'sonner'
import { CreditCard, Wallet, Check, Loader2, Sparkles, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormSection } from '@/components/shared/form-section'
import { OptionPicker } from '@/components/shared/option-picker'
import { BillingResultDialog } from '@/components/settings/billing-result-dialog'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'
import { springs } from '@/lib/motion/springs'
import { haptic } from '@/lib/motion/haptics'
import { PLAN_CONFIG, PLAN_KEYS, formatDzd, resolvePlanAmount, getPlanDisplay, type PlanKey, type BillingPeriod } from '@/lib/plans'

const PURCHASABLE_PLANS = PLAN_KEYS.filter((k) => k !== 'free')

const featureListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const featureItemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0 },
}

interface BillingCardProps {
  plan: PlanKey | null
  status: 'active' | 'inactive' | 'expired' | null
  expiresAt: string | null
  customPriceMonthlyDzd: number | null
  customPriceAnnualDzd: number | null
}

export function BillingCard({ plan, status, expiresAt, customPriceMonthlyDzd, customPriceAnnualDzd }: BillingCardProps) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(plan && plan !== 'free' ? plan : 'starter')
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  const customPricing = { custom_price_monthly_dzd: customPriceMonthlyDzd, custom_price_annual_dzd: customPriceAnnualDzd }
  const selectedCfg = PLAN_CONFIG[selectedPlan]
  const selectedDisplay = getPlanDisplay(selectedPlan, t)
  const isBusinessSelected = selectedPlan === 'business'
  const amount = resolvePlanAmount(selectedPlan, period, customPricing)
  const monthlyBase = isBusinessSelected ? customPriceMonthlyDzd : selectedCfg.priceMonthlyDzd
  const annualPrice = isBusinessSelected ? customPriceAnnualDzd : selectedCfg.priceAnnualDzd
  const annualSavings = period === 'annual' && monthlyBase && annualPrice ? monthlyBase * 12 - annualPrice : null
  const businessPriceMissing = isBusinessSelected && amount === null

  async function handleSubscribe() {
    haptic('medium')
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('billing.genericError'))
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('billing.checkoutError'))
      setLoading(false)
    }
  }

  return (
    <Card>
      <BillingResultDialog baselinePlan={plan} baselineExpiresAt={expiresAt} />
      <CardContent className="space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('billing.cardTitle')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('billing.cardDescription')}</p>
          </div>
        </div>

        <FormSection icon={Wallet} label={t('billing.statusLabel')}>
          <div className="min-w-0">
            {status && (
              <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mb-1.5">
                {plan && plan !== 'free' ? `${getPlanDisplay(plan, t).label} — ` : ''}
                {status === 'active' ? t('billing.statusActive') : status === 'expired' ? t('billing.statusExpired') : t('billing.statusInactive')}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {expiresAt
                ? t('billing.validUntil', {
                    date: new Date(expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
                  })
                : t('billing.noActiveSubscription')}
            </p>
          </div>
        </FormSection>

        <FormSection icon={CreditCard} label={t('billing.choosePlan')}>
          <fieldset disabled={loading} className={cn('space-y-3', loading && 'pointer-events-none opacity-60')}>
            <OptionPicker
              compact
              name="billing-period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'monthly', label: t('billing.periodMonthly') },
                { value: 'annual', label: t('billing.periodAnnual') },
              ]}
            />

            <LayoutGroup id="billing-plan">
              <div role="radiogroup" aria-label={t('billing.planRadioGroupLabel')} className="grid grid-cols-3 gap-2">
                {PURCHASABLE_PLANS.map((key) => {
                  const cfg = PLAN_CONFIG[key]
                  const display = getPlanDisplay(key, t)
                  const isSelected = key === selectedPlan
                  const planAmount = resolvePlanAmount(key, period, customPricing)
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedPlan(key)}
                      className={cn(
                        'relative flex flex-col items-start gap-0.5 rounded-2xl border p-2.5 text-start transition-colors',
                        isSelected ? 'border-primary/30' : 'border-border hover:border-primary/20 hover:bg-muted/30'
                      )}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="billing-plan-selected"
                          aria-hidden
                          className="absolute inset-0 rounded-2xl bg-primary/8 ring-1 ring-primary/30"
                          transition={springs.smooth}
                        />
                      )}
                      {cfg.highlighted && (
                        <span className="relative z-10 mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          <Sparkles className="size-2.5" /> {t('billing.popular')}
                        </span>
                      )}
                      {key === 'business' && (
                        <Building2 className="relative z-10 mb-0.5 size-3.5 text-muted-foreground" strokeWidth={1.75} />
                      )}
                      <span className={cn('relative z-10 text-xs font-bold', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                        {display.label}
                      </span>
                      <span className="relative z-10 text-[11px] font-semibold text-foreground">
                        {planAmount === null ? t('billing.quotePrice') : `${formatDzd(planAmount)} DZD`}
                      </span>
                      {isSelected && (
                        <span className="absolute end-2 top-2 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedPlan}-${period}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={springs.smooth}
                className="space-y-3"
              >
                {businessPriceMissing ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
                    {t('billing.businessPriceMissing')}
                  </div>
                ) : (
                  <>
                    <motion.ul variants={featureListVariants} initial="hidden" animate="show" className="space-y-1.5">
                      {selectedDisplay.features.map((feature) => (
                        <motion.li
                          key={feature}
                          variants={featureItemVariants}
                          transition={springs.snappy}
                          className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <Check className="mt-0.5 size-3 shrink-0 text-success" />
                          {feature}
                        </motion.li>
                      ))}
                    </motion.ul>

                    <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {selectedDisplay.label} · {period === 'annual' ? t('billing.periodAnnualShort') : t('billing.periodMonthlyShort')}
                          {isBusinessSelected && t('billing.negotiatedRate')}
                        </span>
                        <span className="font-semibold text-foreground">{amount !== null ? `${formatDzd(amount)} DZD` : '—'}</span>
                      </div>
                      {annualSavings !== null && annualSavings > 0 && (
                        <p className="mt-1 text-[10.5px] text-success">{t('billing.annualSavings', { amount: formatDzd(annualSavings) })}</p>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {businessPriceMissing ? (
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={<Link href="/faq" />}
                className="w-full"
              >
                {t('billing.contactUs')}
              </Button>
            ) : (
              <Button type="button" onClick={handleSubscribe} disabled={loading} className="w-full gap-2">
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                {loading ? t('billing.redirecting') : status === 'active' ? t('billing.renew') : t('billing.subscribe')}
              </Button>
            )}
          </fieldset>
        </FormSection>
      </CardContent>
    </Card>
  )
}
