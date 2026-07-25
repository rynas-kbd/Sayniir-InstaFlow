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
        <div
          className="inline-flex gap-0.5 rounded-full border-[1.5px] p-1"
          style={{ borderColor: 'var(--organic-sand-300)' }}
        >
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className="rounded-full border-none px-4 py-2 text-[13.5px] font-bold"
            style={billing === 'monthly' ? { background: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-100)' } : { background: 'transparent', color: 'var(--organic-text)' }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className="rounded-full border-none px-4 py-2 text-[13.5px] font-bold"
            style={billing === 'annual' ? { background: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-100)' } : { background: 'transparent', color: 'var(--organic-text)' }}
          >
            Annual −20%
          </button>
        </div>
      </div>

      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-5">
        {PRICING_TIERS.map((tier) => (
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
            <div className="font-heading text-[44px] leading-none">
              {billing === 'annual' ? tier.priceAnnual : tier.priceMonthly}
            </div>
            <p className="mt-1.5 mb-5 text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
              {tier.period}
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
        ))}
      </div>
    </section>
  )
}
