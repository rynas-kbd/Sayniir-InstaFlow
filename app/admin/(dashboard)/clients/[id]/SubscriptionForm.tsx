'use client'

import { useState, useTransition } from 'react'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { PLAN_CONFIG, PLAN_KEYS, formatDzd, getPlanDisplay, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateSubscription } from './actions'
import { toast } from 'sonner'
import { useT } from '@/components/i18n-provider'

interface Props {
  userId: string
  currentPlan: PlanKey
  currentStatus: 'active' | 'inactive' | 'expired'
  expiresAt: string
  amountPaid: number | null
  paymentNotes: string | null
  customPriceMonthlyDzd: number | null
  customPriceAnnualDzd: number | null
}

export default function SubscriptionForm({
  userId,
  currentPlan,
  currentStatus,
  expiresAt,
  amountPaid,
  paymentNotes,
  customPriceMonthlyDzd,
  customPriceAnnualDzd,
}: Props) {
  const t = useT()

  const STATUS_OPTIONS = [
    { value: 'active', label: `✅ ${t('admin.common.status.active')}` },
    { value: 'inactive', label: `⏸️ ${t('admin.common.status.inactive')}` },
    { value: 'expired', label: `❌ ${t('admin.common.status.expired')}` },
  ] as const

  const [plan, setPlan] = useState<PlanKey>(currentPlan)
  const [status, setStatus] = useState<'active' | 'inactive' | 'expired'>(currentStatus)
  const [expires, setExpires] = useState(expiresAt)
  const [amount, setAmount] = useState(amountPaid?.toString() ?? '')
  const [notes, setNotes] = useState(paymentNotes ?? '')
  const [priceMonthly, setPriceMonthly] = useState(customPriceMonthlyDzd?.toString() ?? '')
  const [priceAnnual, setPriceAnnual] = useState(customPriceAnnualDzd?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateSubscription(userId, {
          plan,
          status,
          expires_at: expires || null,
          amount_paid: amount ? Number(amount) : null,
          payment_notes: notes || null,
          custom_price_monthly_dzd: plan === 'business' && priceMonthly ? Number(priceMonthly) : null,
          custom_price_annual_dzd: plan === 'business' && priceAnnual ? Number(priceAnnual) : null,
        })
        toast.success(t('admin.clients.detail.subscriptionForm.successToast'))
      } catch (err) {
        // NOTE: err.message may come from actions.ts (untranslated French,
        // see TODO(i18n) there); only the fallback string is translated here.
        toast.error(err instanceof Error ? err.message : t('admin.clients.detail.subscriptionForm.errorToastFallback'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── Plan selector — visual cards ── */}
      <div>
        <Label className="mb-3 block text-sm font-semibold">{t('admin.clients.detail.subscriptionForm.planLabel')}</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_KEYS.map((key) => {
            const cfg = PLAN_CONFIG[key]
            const display = getPlanDisplay(key, t)
            const isSelected = key === plan
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                className={cn(
                  'group relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200',
                  isSelected
                    ? cn(cfg.borderClass, 'bg-primary/3')
                    : 'border-border hover:border-primary/30'
                )}
              >
                {/* Selected indicator */}
                <div
                  className={cn(
                    'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 transition-all',
                    isSelected ? cn(cfg.borderClass, 'bg-current') : 'border-border'
                  )}
                >
                  {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                </div>

                {cfg.highlighted && (
                  <div className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    <Sparkles className="size-3" /> {t('admin.clients.detail.subscriptionForm.popularBadge')}
                  </div>
                )}

                <span className={cn('text-sm font-bold', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                  {display.label}
                </span>
                <span className="mt-0.5 text-xl font-black text-foreground">
                  {cfg.priceMonthlyDzd === null ? t('admin.clients.detail.subscriptionForm.customQuote') : `${formatDzd(cfg.priceMonthlyDzd)} DZD`}
                </span>
                <span className="text-[10px] text-muted-foreground">{cfg.priceMonthlyDzd === null ? '' : cfg.period}</span>

                <ul className="mt-3 space-y-1.5">
                  {display.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Check className="mt-0.5 size-3 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Current selection pill */}
        <p className="mt-2 text-xs text-muted-foreground">
          {t('admin.clients.detail.subscriptionForm.planSelectedPrefix')}
          <span className={cn('font-semibold', PLAN_CONFIG[plan].borderClass.replace('border-', 'text-'))}>
            {getPlanDisplay(plan, t).label}
          </span>
        </p>
      </div>

      {/* ── Status + dates ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status — native select for reliable form submission */}
        <div className="space-y-1.5">
          <Label>{t('admin.clients.detail.subscriptionForm.statusLabel')}</Label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                  status === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expires_at">{t('admin.clients.detail.subscriptionForm.expiresAtLabel')}</Label>
          <Input
            id="expires_at"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount_paid">{t('admin.clients.detail.subscriptionForm.amountPaidLabel')}</Label>
          <Input
            id="amount_paid"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('admin.clients.detail.subscriptionForm.amountPaidPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_notes">{t('admin.clients.detail.subscriptionForm.paymentNotesLabel')}</Label>
          <Input
            id="payment_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('admin.clients.detail.subscriptionForm.paymentNotesPlaceholder')}
          />
        </div>

        {plan === 'business' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="custom_price_monthly">{t('admin.clients.detail.subscriptionForm.customMonthlyLabel')}</Label>
              <Input
                id="custom_price_monthly"
                type="number"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                placeholder={t('admin.clients.detail.subscriptionForm.customMonthlyPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom_price_annual">{t('admin.clients.detail.subscriptionForm.customAnnualLabel')}</Label>
              <Input
                id="custom_price_annual"
                type="number"
                value={priceAnnual}
                onChange={(e) => setPriceAnnual(e.target.value)}
                placeholder={t('admin.clients.detail.subscriptionForm.customAnnualPlaceholder')}
              />
            </div>
          </>
        )}
      </div>

      {/* Summary before save */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>{t('admin.clients.detail.subscriptionForm.summaryPlanPrefix')}<strong className="text-foreground">{getPlanDisplay(plan, t).label}</strong></span>
        <span>{t('admin.clients.detail.subscriptionForm.summaryStatusPrefix')}<strong className="text-foreground">{STATUS_OPTIONS.find(s => s.value === status)?.label}</strong></span>
        {expires && <span>{t('admin.clients.detail.subscriptionForm.summaryExpiresPrefix')}<strong className="text-foreground">{expires}</strong></span>}
      </div>

      <Button type="submit" className="self-start gap-2" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t('admin.clients.detail.subscriptionForm.submitButton')}
      </Button>
    </form>
  )
}
