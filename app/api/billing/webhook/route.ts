import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const REPLAY_TOLERANCE_SECONDS = 300

// Verifies the Stripe-Signature header per Stripe's documented HMAC scheme:
// header = "t=<timestamp>,v1=<hex hmac-sha256(secret, `${timestamp}.${rawBody}`)>"
// Returns the timestamp on success so the caller can additionally enforce
// freshness — the signature alone doesn't expire, so without a timestamp
// check a captured request body is replayable indefinitely.
function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): number | null {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k, v]
    })
  )
  const timestamp = parts.t
  const expectedSig = parts.v1
  if (!timestamp || !expectedSig) return null

  const computed = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const computedBuf = Buffer.from(computed, 'hex')
  const expectedBuf = Buffer.from(expectedSig, 'hex')
  if (computedBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(computedBuf, expectedBuf)) return null

  const parsedTimestamp = Number(timestamp)
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : null
}

// POST /api/billing/webhook — Stripe webhook. Activates a subscription on
// checkout.session.completed. Requires STRIPE_WEBHOOK_SECRET to be configured
// in the Stripe dashboard's webhook endpoint settings.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook Stripe non configuré' }, { status: 501 })
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('stripe-signature')
  const eventTimestamp = signatureHeader ? verifyStripeSignature(rawBody, signatureHeader, webhookSecret) : null
  if (eventTimestamp === null) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Reject stale requests — the signature itself never expires, so without
  // this a captured webhook body is replayable indefinitely.
  if (Math.abs(Date.now() / 1000 - eventTimestamp) > REPLAY_TOLERANCE_SECONDS) {
    return NextResponse.json({ error: 'Requête expirée' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const supabase = createAdminClient()

  // Dedup on event.id — replaying a previously-processed event (e.g.
  // checkout.session.completed) would otherwise extend expires_at by
  // another month and re-activate accounts on every replay.
  if (event.id) {
    const { error: dedupError } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type })
    if (dedupError) {
      // Unique violation → already processed. Any other error we log and
      // still proceed rather than dropping a legitimate event on an
      // infrastructure hiccup.
      if (dedupError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('[billing:webhook] Failed to record event id:', dedupError)
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId: string | null = session.client_reference_id ?? null
    if (userId) {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', userId).maybeSingle()
      const payload = {
        status: 'active' as const,
        expires_at: expiresAt.toISOString(),
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (existing) {
        await supabase.from('subscriptions').update(payload).eq('user_id', userId)
      } else {
        await supabase.from('subscriptions').insert({ user_id: userId, ...payload, created_at: new Date().toISOString() })
      }
      await supabase.from('channel_accounts').update({ is_active: true }).eq('user_id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const userId: string | null = subscription.metadata?.user_id ?? null
    if (userId) {
      await supabase.from('subscriptions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('user_id', userId)
      await supabase.from('channel_accounts').update({ is_active: false }).eq('user_id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
