import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createChargilyCheckout, createChargilyCustomer } from '@/lib/integrations/chargily/client'
import { resolvePlanAmount, getPlanDisplayFr, type PlanKey, type BillingPeriod } from '@/lib/plans'

const CHECKOUT_RATE_LIMIT = 10
const CHECKOUT_RATE_WINDOW_MS = 60_000

const PURCHASABLE_PLANS: PlanKey[] = ['starter', 'pro', 'business']
const BILLING_PERIODS: BillingPeriod[] = ['monthly', 'annual']

/**
 * POST /api/billing/checkout — creates a Chargily Pay v2 checkout and
 * returns its hosted payment URL. Body: { plan: 'starter'|'pro'|'business',
 * period: 'monthly'|'annual' }.
 *
 * Chargily has no recurring billing — this always creates a one-off
 * checkout; renewal is the customer clicking "Renouveler" again before or
 * after expiry (see components/billing/renewal-banner.tsx and the
 * auto-expire cron at app/api/admin/auto-expire/route.ts).
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof Response) return auth
  const { user } = auth

  const rateLimit = checkRateLimit(`billing-checkout:${user.id}`, CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans un instant.' }, { status: 429 })
  }

  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Facturation non configurée — CHARGILY_SECRET_KEY doit être défini.' },
      { status: 501 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const plan = body?.plan as PlanKey | undefined
  const period = body?.period as BillingPeriod | undefined

  if (!plan || !PURCHASABLE_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'plan invalide' }, { status: 400 })
  }
  if (!period || !BILLING_PERIODS.includes(period)) {
    return NextResponse.json({ error: 'period invalide' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('custom_price_monthly_dzd, custom_price_annual_dzd, chargily_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const amountDzd = resolvePlanAmount(plan, period, subscription)
  if (amountDzd === null) {
    return NextResponse.json(
      { error: "Votre tarif Business n'a pas encore été défini. Contactez-nous." },
      { status: 400 }
    )
  }
  if (amountDzd <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  let chargilyCustomerId = subscription?.chargily_customer_id ?? null
  if (!chargilyCustomerId) {
    const customerResult = await createChargilyCustomer({ name: user.user_metadata?.instagram_username, email: user.email })
    if (customerResult.ok) {
      chargilyCustomerId = customerResult.data.id
      await supabaseAdmin
        .from('subscriptions')
        .upsert({ user_id: user.id, chargily_customer_id: chargilyCustomerId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }
    // Not fatal — a customer id is a convenience for the Chargily dashboard,
    // not required for the checkout itself.
  }

  const origin = request.nextUrl.origin
  const checkoutResult = await createChargilyCheckout({
    amountDzd,
    successUrl: `${origin}/settings?billing=success`,
    // plan/period are threaded through so the failure dialog's "Réessayer"
    // (components/settings/billing-result-dialog.tsx) knows what to relaunch
    // without having to remember client-side state across the redirect.
    failureUrl: `${origin}/settings?billing=failed&plan=${plan}&period=${period}`,
    webhookEndpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? origin}/api/webhooks/chargily`,
    customerId: chargilyCustomerId ?? undefined,
    locale: 'fr',
    description: `Abonnement Raddlly — ${getPlanDisplayFr(plan).label} (${period === 'annual' ? 'annuel' : 'mensuel'})`,
    metadata: { user_id: user.id, plan, period },
  })

  if (!checkoutResult.ok) {
    console.error('[billing/checkout] Chargily error:', checkoutResult.reason, checkoutResult.detail)
    return NextResponse.json({ error: 'Impossible de créer le paiement pour le moment' }, { status: 502 })
  }

  // Recorded before responding so the webhook has a server-trusted record of
  // what this checkout is for and how much it should be worth — it must
  // never infer the plan/amount from the (client-controllable) webhook body.
  const { error: insertError } = await supabaseAdmin.from('billing_checkouts').insert({
    id: checkoutResult.data.id,
    user_id: user.id,
    plan,
    billing_period: period,
    amount_dzd: amountDzd,
    status: 'pending',
  })
  if (insertError) {
    console.error('[billing/checkout] Failed to record billing_checkouts row:', insertError)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutResult.data.checkoutUrl })
}
