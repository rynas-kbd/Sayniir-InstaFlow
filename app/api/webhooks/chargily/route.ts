import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyChargilySignature } from '@/lib/integrations/chargily/client'
import { computeExpiresAt } from '@/lib/billing/period'
import type { BillingPeriod, PlanKey } from '@/lib/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ChargilyEvent {
  id: string
  type: 'checkout.paid' | 'checkout.failed' | 'checkout.canceled' | string
  data: {
    id: string
    status: string
    amount: number
  }
}

/**
 * POST /api/webhooks/chargily — Chargily Pay v2 webhook. Activates a
 * subscription on checkout.paid.
 *
 * Placed under /api/webhooks/ (not /api/billing/) deliberately — proxy.ts's
 * matcher excludes the `api/webhook` prefix, so this route skips the
 * middleware's supabase.auth.getUser() round-trip on every inbound call,
 * same as the Meta channel webhooks.
 *
 * Chargily signs with the API secret key directly (no separate webhook
 * secret) and the signature carries no timestamp — unlike Stripe's
 * `t=...,v1=...` scheme, there's no freshness window to enforce, so
 * chargily_webhook_events (event-id dedup) is the ONLY replay defense here.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Webhook Chargily non configuré' }, { status: 501 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }
  if (!verifyChargilySignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 403 })
  }

  let event: ChargilyEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Dedup on event.id — Chargily can redeliver, and replaying checkout.paid
  // would otherwise re-extend expires_at on every replay.
  if (event.id) {
    const { error: dedupError } = await supabase
      .from('chargily_webhook_events')
      .insert({ event_id: event.id, event_type: event.type })
    if (dedupError) {
      if (dedupError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('[webhooks/chargily] Failed to record event id:', dedupError)
    }
  }

  if (event.type === 'checkout.paid') {
    const checkoutId = event.data?.id
    if (!checkoutId) {
      return NextResponse.json({ received: true })
    }

    const { data: checkout } = await supabase
      .from('billing_checkouts')
      .select('user_id, plan, billing_period, amount_dzd, status')
      .eq('id', checkoutId)
      .maybeSingle()

    if (!checkout) {
      // No server-side record of this checkout — nothing to activate. We
      // never infer plan/amount from the webhook payload alone.
      console.error('[webhooks/chargily] checkout.paid for unknown checkout id:', checkoutId)
      return NextResponse.json({ received: true })
    }

    if (checkout.status === 'paid') {
      // Already processed (event-id dedup should already have caught this,
      // but a second distinct event referencing the same checkout is
      // plausible) — avoid double-extending expires_at.
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (typeof event.data.amount === 'number' && event.data.amount !== checkout.amount_dzd) {
      console.error('[webhooks/chargily] Amount mismatch — refusing to activate', {
        checkoutId,
        expected: checkout.amount_dzd,
        received: event.data.amount,
      })
      return NextResponse.json({ received: true })
    }

    const plan = checkout.plan as PlanKey
    const period = checkout.billing_period as BillingPeriod
    const now = new Date()

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('expires_at')
      .eq('user_id', checkout.user_id)
      .maybeSingle()

    const currentExpiresAt = existingSub?.expires_at ? new Date(existingSub.expires_at) : null
    const expiresAt = computeExpiresAt(currentExpiresAt, period, now)

    const payload = {
      plan,
      status: 'active' as const,
      billing_period: period,
      expires_at: expiresAt.toISOString(),
      started_at: now.toISOString(),
      amount_paid: checkout.amount_dzd,
      payment_notes: `Chargily ${checkoutId}`,
      updated_at: now.toISOString(),
    }

    if (existingSub) {
      await supabase.from('subscriptions').update(payload).eq('user_id', checkout.user_id)
    } else {
      await supabase.from('subscriptions').insert({ user_id: checkout.user_id, ...payload, created_at: now.toISOString() })
    }
    await supabase.from('channel_accounts').update({ is_active: true }).eq('user_id', checkout.user_id)
    await supabase.from('billing_checkouts').update({ status: 'paid', paid_at: now.toISOString() }).eq('id', checkoutId)
  }

  if (event.type === 'checkout.failed' || event.type === 'checkout.canceled') {
    const checkoutId = event.data?.id
    if (checkoutId) {
      const status = event.type === 'checkout.failed' ? 'failed' : 'canceled'
      await supabase.from('billing_checkouts').update({ status }).eq('id', checkoutId).eq('status', 'pending')
    }
  }

  return NextResponse.json({ received: true })
}
