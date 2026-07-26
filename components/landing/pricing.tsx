'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PRICING_TIERS } from '@/lib/landing-content'
import { SectionHeader } from './chrome'

const TONE_TAG_STYLE: Record<'neutral' | 'a' | 's', React.CSSProperties> = {
  neutral: { background: 'var(--organic-sand-100)', color: 'var(--organic-sand-800)' },
  a: { background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' },
  s: { background: 'var(--organic-sage-100)', color: 'var(--organic-sage-800)' },
}

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="pb-[88px]">
      <SectionHeader kicker="06 — Pricing" note="No per-contact fees. Ever." />

      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <h2 className="max-w-[18ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
          Start free. Grow flat.
        </h2>

        {/* Toggle switch with sliding background for a smooth transition */}
        <div
          className="relative inline-flex rounded-full border-[1.5px] p-1"
          style={{ borderColor: 'var(--organic-sand-300)' }}
        >
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
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className="relative z-10 rounded-full border-none px-4 py-2 text-[13.5px] font-bold transition-colors duration-300"
            style={{ color: billing === 'annual' ? 'var(--organic-terracotta-100)' : 'var(--organic-text)' }}
          >
            Annual −17%
          </button>
        </div>
      </div>

      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-5">
        {PRICING_TIERS.map((tier) => {
          return (
            <div
              key={tier.tag}
              data-reveal
              className="lp-card card relative flex flex-col"
              style={
                tier.highlighted
                  ? { border: '2px solid var(--organic-terracotta)', zIndex: 1 }
                  : undefined
              }
            >
              {tier.highlighted && (
                <span
                  className="absolute -top-3 right-5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' }}
                >
                  Most popular
                </span>
              )}
              <span className="mb-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px]" style={TONE_TAG_STYLE[tier.tone]}>
                {tier.tag}
              </span>

              {/* Smooth transition container for price display */}
              <div className="relative h-[84px] overflow-hidden">
                <div
                  className="flex flex-col transition-transform duration-300 ease-out"
                  style={{
                    transform: billing === 'annual' ? 'translateY(-50%)' : 'translateY(0%)',
                    height: '200%',
                  }}
                >
                  {/* Monthly pricing view */}
                  <div className="flex h-1/2 items-center gap-2">
                    <span className="font-heading text-[44px] leading-none">
                      {tier.priceMonthly}
                    </span>
                  </div>

                  {/* Annual pricing view: yearly total, undiscounted total + badge stacked below
                      (not inline) so they never overflow the card on narrow widths */}
                  <div className="flex h-1/2 flex-col justify-center gap-1">
                    <span className="font-heading text-[44px] leading-none">
                      {tier.priceAnnual}
                    </span>
                    {tier.priceAnnualCrossedOut && (
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-sm text-muted-foreground/60 line-through decoration-destructive/60">
                          {tier.priceAnnualCrossedOut}
                        </span>
                        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
                          -17%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-1.5 mb-5 text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
                {billing === 'annual' ? (tier.periodAnnual ?? tier.period) : tier.period}
              </p>
              <ul className="mb-6 flex flex-col gap-2.5 text-[14.5px]" style={{ listStyle: 'none', padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="font-bold" style={{ color: 'var(--organic-sage-700)' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-secondary'} btn-block`}
                style={{ marginTop: 'auto' }}
              >
                {tier.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
