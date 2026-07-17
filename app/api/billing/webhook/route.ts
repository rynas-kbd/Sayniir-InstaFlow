import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Verifies the Stripe-Signature header per Stripe's documented HMAC scheme:
// header = "t=<timestamp>,v1=<hex hmac-sha256(secret, `${timestamp}.${rawBody}`)>"
function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k, v]
    })
  )
  const timestamp = parts.t
  const expectedSig = parts.v1
  if (!timestamp || !expectedSig) return false

  const computed = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const computedBuf = Buffer.from(computed, 'hex')
  const expectedBuf = Buffer.from(expectedSig, 'hex')
  if (computedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(computedBuf, expectedBuf)
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
  if (!signatureHeader || !verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const supabase = createAdminClient()

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
