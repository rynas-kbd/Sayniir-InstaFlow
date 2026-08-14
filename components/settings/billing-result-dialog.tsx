'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Button } from '@/components/ui/button'
import { haptic } from '@/lib/motion/haptics'
import { springs } from '@/lib/motion/springs'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/components/i18n-provider'
import { getPlanDisplay, type PlanKey, type BillingPeriod } from '@/lib/plans'

const POLL_INTERVAL_MS = 1200
const MAX_POLL_ATTEMPTS = 6 // ~7s total

type ResultState =
  | { kind: 'verifying' }
  | { kind: 'confirmed'; plan: PlanKey; expiresAt: string | null }
  | { kind: 'pending' }
  | { kind: 'failed'; plan: PlanKey | null; period: BillingPeriod | null }

/** Only what genuinely arrives asynchronously — 'verifying' and 'failed' are derived
 * straight from the URL at render time below, so they never need a setState call
 * inside the effect body (react-hooks/set-state-in-effect: effects should synchronize
 * with the outside world, not assign a value React could already compute while rendering). */
type PollResult = { kind: 'confirmed'; plan: PlanKey; expiresAt: string | null } | { kind: 'pending' }

interface BillingResultDialogInnerProps {
  /** The subscription state as it was BEFORE this checkout — the poll below waits for a real
   * change from this baseline (plan or expires_at), not just "some active row exists". Without
   * this, a renewal on an already-active plan would report success on the very first poll,
   * before the webhook has actually extended expires_at. */
  baselinePlan: PlanKey | null
  baselineExpiresAt: string | null
}

function BillingResultDialogInner({ baselinePlan, baselineExpiresAt }: BillingResultDialogInnerProps) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const billing = searchParams.get('billing')
  const failedPlan = searchParams.get('plan') as PlanKey | null
  const failedPeriod = searchParams.get('period') as BillingPeriod | null

  const [pollResult, setPollResult] = useState<PollResult | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const pollAttempt = useRef(0)

  const state: ResultState | null = dismissed
    ? null
    : billing === 'success'
      ? (pollResult ?? { kind: 'verifying' })
      : billing === 'failed'
        ? { kind: 'failed', plan: failedPlan, period: failedPeriod }
        : null

  useEffect(() => {
    if (billing !== 'success') return
    pollAttempt.current = 0
    let cancelled = false
    const supabase = createClient()

    async function poll() {
      // No .eq('user_id', ...) — the SELECT policy on subscriptions already
      // scopes this to the caller's own row, so there's nothing to add here.
      const { data } = await supabase.from('subscriptions').select('plan, status, expires_at').maybeSingle()
      if (cancelled) return

      const changed = data?.plan !== baselinePlan || data?.expires_at !== baselineExpiresAt
      if (data?.status === 'active' && changed) {
        setPollResult({ kind: 'confirmed', plan: (data.plan as PlanKey) ?? 'starter', expiresAt: data.expires_at ?? null })
        return
      }

      pollAttempt.current += 1
      if (pollAttempt.current >= MAX_POLL_ATTEMPTS) {
        setPollResult({ kind: 'pending' })
        return
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [billing, baselinePlan, baselineExpiresAt])

  useEffect(() => {
    if (state?.kind === 'confirmed') haptic('success')
  }, [state?.kind])

  function handleClose() {
    setDismissed(true)
    router.replace('/settings')
  }

  async function handleRetry() {
    if (state?.kind !== 'failed' || !state.plan || !state.period) {
      handleClose()
      return
    }
    setRetrying(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: state.plan, period: state.period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('billing.genericError'))
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('billing.checkoutError'))
      setRetrying(false)
    }
  }

  const open = state !== null

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <ResponsiveDialogContent className="sm:max-w-sm" showCloseButton={state?.kind !== 'verifying'}>
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>{t('billing.result.dialogTitle')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t('billing.result.dialogDescription')}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {state?.kind === 'verifying' && (
          <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">{t('billing.result.verifyingTitle')}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t('billing.result.verifyingSub')}</p>
            </div>
          </div>
        )}

        {state?.kind === 'confirmed' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-success/25 bg-success/8 px-6 py-8 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
              className="flex size-11 items-center justify-center rounded-full bg-success/15"
            >
              <CheckCircle2 className="size-5 text-success" />
            </motion.div>
            <div>
              <p className="text-[15px] font-bold text-foreground">{t('billing.result.confirmedTitle')}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {state.expiresAt
                  ? t('billing.result.confirmedActiveWithExpiry', {
                      plan: getPlanDisplay(state.plan, t).label,
                      date: new Date(state.expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
                    })
                  : t('billing.result.confirmedActiveNoExpiry', { plan: getPlanDisplay(state.plan, t).label })}
              </p>
            </div>
          </div>
        )}

        {state?.kind === 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.smooth}
            className="flex flex-col items-center gap-3 px-2 py-8 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">{t('billing.result.pendingTitle')}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t('billing.result.pendingSub')}</p>
            </div>
          </motion.div>
        )}

        {state?.kind === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.smooth}
            className="flex flex-col items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-8 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/15">
              <XCircle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">{t('billing.result.failedTitle')}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t('billing.result.failedSub')}</p>
            </div>
          </motion.div>
        )}

        {(state?.kind === 'confirmed' || state?.kind === 'pending' || state?.kind === 'failed') && (
          <ResponsiveDialogFooter>
            {state.kind === 'confirmed' && (
              <Button type="button" className="w-full" onClick={handleClose}>
                {t('billing.result.perfect')}
              </Button>
            )}
            {state.kind === 'pending' && (
              <Button type="button" variant="outline" className="w-full" onClick={handleClose}>
                {t('billing.result.close')}
              </Button>
            )}
            {state.kind === 'failed' && (
              <>
                <Button type="button" className="w-full gap-2 sm:w-auto" onClick={handleRetry} disabled={retrying}>
                  {retrying && <Loader2 className="size-3.5 animate-spin" />}
                  {t('billing.result.retry')}
                </Button>
                <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={handleClose}>
                  {t('billing.result.close')}
                </Button>
              </>
            )}
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Reads ?billing=success|failed left by Chargily's success_url/failure_url
 * redirect and shows a proper confirmation screen instead of a toast — on
 * success it verifies the subscription actually activated (polls the row
 * this user can already SELECT under RLS) before celebrating, the same way
 * App Store/Play Store verify a purchase before confirming it. useSearchParams()
 * needs its own Suspense boundary or it opts the whole page out of static
 * rendering (same constraint as BillingStatusToast before it).
 */
export function BillingResultDialog(props: BillingResultDialogInnerProps) {
  return (
    <Suspense fallback={null}>
      <BillingResultDialogInner {...props} />
    </Suspense>
  )
}
