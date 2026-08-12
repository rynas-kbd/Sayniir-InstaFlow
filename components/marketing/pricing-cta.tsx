'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { PlanKey } from '@/lib/plans'

interface PricingCtaProps {
  planKey: PlanKey
  isQuote: boolean
  isAuthenticated: boolean
  label: string
  highlighted?: boolean
}

/**
 * Logged-out visitors go through /register as before. A logged-in user
 * clicking a plan's CTA skips registration and launches the Chargily
 * checkout directly — no reason to send someone who already has an account
 * back through signup just to land on /settings afterwards.
 */
export function PricingCta({ planKey, isQuote, isAuthenticated, label, highlighted }: PricingCtaProps) {
  const [loading, setLoading] = useState(false)
  const variant = highlighted ? 'default' : 'outline'

  if (isQuote) {
    return (
      <Button size="lg" variant={variant} nativeButton={false} render={<Link href="/faq" />} className="mt-8 cursor-pointer">
        Nous contacter
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button size="lg" variant={variant} nativeButton={false} render={<Link href="/register" />} className="mt-8 cursor-pointer">
        {label}
      </Button>
    )
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, period: 'monthly' }),
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
    <Button type="button" size="lg" variant={variant} onClick={handleSubscribe} disabled={loading} className="mt-8 cursor-pointer">
      {label}
    </Button>
  )
}
