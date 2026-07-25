'use client'

import { useState, useTransition } from 'react'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { PLAN_CONFIG, PLAN_KEYS, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateSubscription } from './actions'
import { toast } from 'sonner'

interface Props {
  userId: string
  currentPlan: PlanKey
  currentStatus: 'active' | 'inactive' | 'expired'
  expiresAt: string
  amountPaid: number | null
  paymentNotes: string | null
}

const STATUS_OPTIONS = [
  { value: 'active',   label: '✅ Actif' },
  { value: 'inactive', label: '⏸️ Inactif' },
  { value: 'expired',  label: '❌ Expiré' },
] as const

export default function SubscriptionForm({
  userId,
  currentPlan,
  currentStatus,
  expiresAt,
  amountPaid,
  paymentNotes,
}: Props) {
  const [plan, setPlan] = useState<PlanKey>(currentPlan)
  const [status, setStatus] = useState<'active' | 'inactive' | 'expired'>(currentStatus)
  const [expires, setExpires] = useState(expiresAt)
  const [amount, setAmount] = useState(amountPaid?.toString() ?? '')
  const [notes, setNotes] = useState(paymentNotes ?? '')
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
        })
        toast.success('Abonnement mis à jour !')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── Plan selector — visual cards ── */}
      <div>
        <Label className="mb-3 block text-sm font-semibold">Plan</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const cfg = PLAN_CONFIG[key]
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
                    <Sparkles className="size-3" /> Populaire
                  </div>
                )}

                <span className={cn('text-sm font-bold', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                  {cfg.label}
                </span>
                <span className="mt-0.5 text-xl font-black text-foreground">{cfg.priceMonthly}</span>
                <span className="text-[10px] text-muted-foreground">{cfg.period}</span>

                <ul className="mt-3 space-y-1.5">
                  {cfg.features.map((f) => (
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
          Plan sélectionné :{' '}
          <span className={cn('font-semibold', PLAN_CONFIG[plan].borderClass.replace('border-', 'text-'))}>
            {PLAN_CONFIG[plan].label}
          </span>
        </p>
      </div>

      {/* ── Status + dates ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status — native select for reliable form submission */}
        <div className="space-y-1.5">
          <Label>Statut de l&apos;abonnement</Label>
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
          <Label htmlFor="expires_at">Date d&apos;expiration</Label>
          <Input
            id="expires_at"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount_paid">Montant payé (DZD)</Label>
          <Input
            id="amount_paid"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ex: 2000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_notes">Notes de paiement</Label>
          <Input
            id="payment_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payé cash le 20/05"
          />
        </div>
      </div>

      {/* Summary before save */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>Plan : <strong className="text-foreground">{PLAN_CONFIG[plan].label}</strong></span>
        <span>Statut : <strong className="text-foreground">{STATUS_OPTIONS.find(s => s.value === status)?.label}</strong></span>
        {expires && <span>Expire le : <strong className="text-foreground">{expires}</strong></span>}
      </div>

      <Button type="submit" className="self-start gap-2" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer l&apos;abonnement
      </Button>
    </form>
  )
}
