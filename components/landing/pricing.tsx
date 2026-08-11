'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PRICING_TIERS } from '@/lib/marketing-content'
import { SectionHeader } from './chrome'

// Reads the real tarification from lib/marketing-content.ts — the same
// source app/(marketing)/pricing/page.tsx uses — instead of the separate
// fictional PRICING_TIERS that used to live in lib/landing-content.ts
// (Gratuit/29€/79€, contradicting the real DZD prices shown on /pricing).
// Annual figures (-20%, per business decision) live alongside the monthly
// ones in that single source so both pages can never drift apart again.
export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="pb-[88px]">
      <SectionHeader kicker="06 — Tarifs" note="Sans engagement, annulable à tout moment." />

      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <h2 className="max-w-[18ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
          Un prix simple, sans surprise.
        </h2>

        <div className="relative inline-flex rounded-full border-[1.5px] p-1" style={{ borderColor: 'var(--organic-sand-300)' }}>
          <div
            className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
            style={{
              background: 'var(--organic-terracotta)',
              width: 'calc(50% - 6px)',
              left: billing === 'monthly' ? '4px' : 'calc(50% + 2px)',
            }}
          />
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className="relative z-10 rounded-full border-none px-4 py-2 text-[13.5px] font-bold transition-colors duration-300"
            style={{ color: billing === 'monthly' ? 'var(--organic-terracotta-100)' : 'var(--organic-text)' }}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className="relative z-10 rounded-full border-none px-4 py-2 text-[13.5px] font-bold transition-colors duration-300"
            style={{ color: billing === 'annual' ? 'var(--organic-terracotta-100)' : 'var(--organic-text)' }}
          >
            Annuel −20%
          </button>
        </div>
      </div>

      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-5">
        {PRICING_TIERS.map((tier) => {
          const price = billing === 'annual' ? tier.priceAnnual : tier.price
          const period = billing === 'annual' ? tier.periodAnnual : tier.period
          const isQuote = tier.price === 'Sur devis'

          return (
            <div
              key={tier.name}
              data-reveal
              className={`lp-card card relative flex flex-col${tier.highlighted ? ' lp-pricing-highlight' : ''}`}
              style={tier.highlighted ? { zIndex: 1 } : undefined}
            >
              {tier.highlighted && (
                <span
                  className="absolute -top-3 right-5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' }}
                >
                  Le plus populaire
                </span>
              )}

              <span className="mb-4 font-heading text-xl">{tier.name}</span>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-[36px] leading-none">{price}</span>
                {period && (
                  <span className="text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
                    {period}
                  </span>
                )}
                {billing === 'annual' && !isQuote && tier.priceAnnualCrossedOut && (
                  <span className="text-[13px] text-muted-foreground/60 line-through decoration-destructive/60">
                    {tier.priceAnnualCrossedOut} {tier.periodAnnual}
                  </span>
                )}
              </div>
              <p className="mt-2 mb-5 text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 74%, transparent)' }}>
                {tier.description}
              </p>

              <ul className="mb-6 flex flex-1 flex-col gap-2.5 text-[14.5px]" style={{ listStyle: 'none', padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: 'var(--organic-sage-700)' }} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-secondary'} btn-block`}
                style={{ marginTop: 'auto' }}
              >
                {isQuote ? 'Nous contacter' : 'Commencer'}
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
