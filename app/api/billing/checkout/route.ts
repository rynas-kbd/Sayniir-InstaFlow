import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/billing/checkout — creates a Stripe Checkout session and returns its URL.
// Requires STRIPE_SECRET_KEY + STRIPE_PRICE_ID env vars (not configured yet in this
// deployment — this is scaffolding, ready to go live once real Stripe keys are added).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Facturation non configurée — STRIPE_SECRET_KEY et STRIPE_PRICE_ID doivent être définis." },
      { status: 501 }
    )
  }

  const origin = request.nextUrl.origin
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/settings?billing=success`,
    cancel_url: `${origin}/settings?billing=cancelled`,
    client_reference_id: user.id,
    customer_email: user.email ?? '',
  })

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[billing/checkout] Stripe error:', data.error)
    return NextResponse.json({ error: data.error?.message || 'Erreur Stripe' }, { status: 502 })
  }

  return NextResponse.json({ url: data.url })
}
