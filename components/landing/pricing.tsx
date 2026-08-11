'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Zap, Building2 } from 'lucide-react'
import { PRICING_TIERS } from '@/lib/marketing-content'
import { SectionHeader } from './chrome'

/* ─── Animated price counter ─────────────────────────────────────────── */
function AnimatedPrice({ value, className }: { value: string; className?: string }) {
  const [current, setCurrent] = useState(value)
  const [exit, setExit] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setExit(true)
    const t = setTimeout(() => {
      setCurrent(value)
      setExit(false)
    }, 190)
    return () => clearTimeout(t)
  }, [value])

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        transition: 'transform .22s cubic-bezier(.16,1,.3,1), opacity .2s ease',
        transform: exit ? 'translateY(-10px) scale(.9)' : 'translateY(0) scale(1)',
        opacity: exit ? 0 : 1,
        willChange: 'transform, opacity',
      }}
    >
      {current}
    </span>
  )
}

/* ─── 3-D tilt card ──────────────────────────────────────────────────── */
function TiltCard({
  children,
  className,
  style,
  highlighted,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  highlighted?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const animFrame = useRef<number>(0)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(animFrame.current)
    const el = ref.current
    if (!el) return
    animFrame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const rx = ((e.clientX - r.left) / r.width - 0.5) * 12
      const ry = ((e.clientY - r.top) / r.height - 0.5) * -9
      el.style.transition = 'transform .08s ease, box-shadow .08s ease'
      el.style.transform = `perspective(900px) rotateX(${ry}deg) rotateY(${rx}deg) translateY(-5px)`
      el.style.boxShadow = highlighted
        ? `${rx * 1.1}px ${ry * -1}px 22px rgba(0,0,0,.06), 0 18px 44px color-mix(in srgb, var(--organic-terracotta) 24%, transparent)`
        : `${rx * .6}px ${ry * -.6}px 16px rgba(0,0,0,.05), 0 14px 32px rgba(0,0,0,.08)`
    })
  }

  const onLeave = () => {
    cancelAnimationFrame(animFrame.current)
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1), box-shadow .4s ease'
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)'
    el.style.boxShadow = highlighted
      ? '0 8px 30px color-mix(in srgb, var(--organic-terracotta) 16%, transparent)'
      : '0 1px 4px rgba(0,0,0,.05)'
  }

  return (
    <div
      ref={ref}
      data-reveal
      className={className}
      /* override .lp-card:hover so CSS and JS don't fight each other */
      style={{
        ...style,
        transition: 'transform .08s ease, box-shadow .08s ease',
        willChange: 'transform',
        /* disable the CSS :hover rule on pricing cards */
        '--lp-card-hover-disabled': '1',
      } as React.CSSProperties}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

/* ─── Per-tier icon mapping ──────────────────────────────────────────── */
const TIER_ICONS = [Zap, Sparkles, Building2]

/* ─── Staggered feature row ──────────────────────────────────────────── */
function FeatureRow({ feature, idx }: { feature: string; idx: number }) {
  return (
    <li
      className="flex gap-2.5 items-start"
      style={{
        animation: 'pricingFeatureIn .38s cubic-bezier(.16,1,.3,1) both',
        animationDelay: `${idx * 60}ms`,
      }}
    >
      <span
        className="mt-[3px] shrink-0 grid size-[18px] place-content-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--organic-sage-500) 16%, transparent)' }}
      >
        <Check className="size-[10px]" style={{ color: 'var(--organic-sage-700)' }} strokeWidth={3.2} />
      </span>
      <span style={{ lineHeight: 1.5 }}>{feature}</span>
    </li>
  )
}

/* ─── Main export ────────────────────────────────────────────────────── */
export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="pb-[88px]">
      <SectionHeader kicker="06 — Tarifs" note="Sans engagement, annulable à tout moment." />

      {/* Row: heading + billing toggle */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <h2 className="max-w-[18ch] font-heading text-[clamp(30px,3.6vw,46px)] leading-[1.1]">
          Un prix simple, sans surprise.
        </h2>

        {/* Billing pill toggle */}
        <div
          className="relative inline-flex rounded-full border-[1.5px] p-1"
          style={{ borderColor: 'var(--organic-sand-300)' }}
        >
          {/* Sliding highlight */}
          <span
            className="pointer-events-none absolute top-1 bottom-1 rounded-full"
            style={{
              background: 'var(--organic-terracotta)',
              width: 'calc(50% - 6px)',
              left: billing === 'monthly' ? '4px' : 'calc(50% + 2px)',
              transition: 'left .38s cubic-bezier(.16,1,.3,1)',
              boxShadow: '0 2px 10px color-mix(in srgb, var(--organic-terracotta) 38%, transparent)',
            }}
          />
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className="relative z-10 rounded-full border-none px-4 py-2 text-[13.5px] font-bold"
            style={{
              color: billing === 'monthly' ? '#fff' : 'var(--organic-text)',
              transition: 'color .3s ease',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className="relative z-10 rounded-full border-none px-4 py-2 text-[13.5px] font-bold"
            style={{
              color: billing === 'annual' ? '#fff' : 'var(--organic-text)',
              transition: 'color .3s ease',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            Annuel&nbsp;−20%
          </button>
        </div>
      </div>

      {/*
        Annual savings badge — ALWAYS occupies its layout height (h-8 = 32px)
        so the cards grid below never jumps when billing switches.
        Visibility is controlled by opacity + scale only.
      */}
      <div className="mb-5 h-8 flex items-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            background: 'color-mix(in srgb, var(--organic-sage-400) 16%, transparent)',
            color: 'var(--organic-sage-800)',
            border: '1px solid color-mix(in srgb, var(--organic-sage-500) 28%, transparent)',
            transition: 'transform .4s cubic-bezier(.16,1,.3,1), opacity .28s ease',
            transform: billing === 'annual' ? 'scale(1) translateY(0)' : 'scale(.8) translateY(3px)',
            opacity: billing === 'annual' ? 1 : 0,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles className="size-3 shrink-0" />
          Vous économisez 20&nbsp;% sur l&apos;abonnement annuel
        </div>
      </div>

      {/* Cards */}
      <div data-reveal-group className="lp-stagger grid grid-cols-1 md:grid-cols-3 items-stretch gap-5">
        {PRICING_TIERS.map((tier, idx) => {
          const price = billing === 'annual' ? tier.priceAnnual : tier.price
          const period = billing === 'annual' ? tier.periodAnnual : tier.period
          const isQuote = tier.price === 'Sur devis'
          const Icon = TIER_ICONS[idx % TIER_ICONS.length]

          return (
            <TiltCard
              key={tier.name}
              highlighted={tier.highlighted}
              /*
               * overflow-hidden so the -top-3.5 badge doesn't escape the
               * card border-radius on older Safari, but we need the badge
               * to sit ABOVE the card visually. Solution: keep overflow
               * visible on the outer div and clip only the shimmer layer.
               * Using `isolate` creates a stacking context so the badge
               * z-index works independently of siblings.
               */
              className={`lp-card card relative isolate flex flex-col${
                tier.highlighted ? ' lp-pricing-highlight' : ''
              }`}
              style={tier.highlighted ? { zIndex: 1 } : undefined}
            >
              {/* Shimmer border on Pro — clipped to card bounds */}
              {tier.highlighted && (
                <span
                  aria-hidden
                  className="lp-pricing-shimmer pointer-events-none absolute inset-0"
                  style={{ borderRadius: 'inherit', zIndex: -1 }}
                />
              )}

              {/* Popular badge — sits above card via z-index + negative top */}
              {tier.highlighted && (
                <span
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap"
                  style={{
                    background: 'var(--organic-terracotta)',
                    color: '#fff',
                    zIndex: 2,
                    boxShadow: '0 4px 14px color-mix(in srgb, var(--organic-terracotta) 38%, transparent)',
                    animation: 'pricingBadgePop .45s cubic-bezier(.16,1,.3,1) .1s both',
                  }}
                >
                  <Sparkles className="size-3 shrink-0" />
                  Le plus populaire
                </span>
              )}

              {/* Extra top padding on highlighted card so badge doesn't
                  overlap the icon/name row */}
              <div className={`mb-4 flex items-center gap-3${tier.highlighted ? ' mt-3' : ''}`}>
                <span
                  className="grid size-9 place-content-center rounded-xl shrink-0"
                  style={{
                    background: tier.highlighted
                      ? 'color-mix(in srgb, var(--organic-terracotta) 14%, transparent)'
                      : 'color-mix(in srgb, var(--organic-text) 7%, transparent)',
                    color: tier.highlighted ? 'var(--organic-terracotta)' : 'var(--organic-text)',
                  }}
                >
                  <Icon className="size-4" strokeWidth={2.2} />
                </span>
                <span className="font-heading text-xl font-bold">{tier.name}</span>
              </div>

              {/* Price row */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <AnimatedPrice
                  value={price}
                  className="font-heading text-[40px] leading-none font-extrabold"
                />
                {/* Only render period span when it has content */}
                {period && period.trim() !== '' && (
                  <span
                    className="text-[13px]"
                    style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                  >
                    {period}
                  </span>
                )}
              </div>

              {/*
                Crossed-out price — always reserves its height (20px) so the
                description paragraph doesn't jump between billing modes.
              */}
              <div
                className="mt-1.5 mb-1 h-5 text-[12px]"
                style={{ color: 'color-mix(in srgb, var(--organic-text) 38%, transparent)' }}
              >
                {billing === 'annual' && !isQuote && tier.priceAnnualCrossedOut && (
                  <span className="line-through">
                    {tier.priceAnnualCrossedOut}&nbsp;{tier.periodAnnual}
                  </span>
                )}
              </div>

              <p
                className="mb-5 text-[13.5px] leading-[1.62]"
                style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}
              >
                {tier.description}
              </p>

              {/* Divider */}
              <hr
                style={{
                  border: 'none',
                  borderTop: '1.5px solid color-mix(in srgb, var(--organic-text) 7%, transparent)',
                  marginBottom: 18,
                }}
              />

              {/*
                Features — key includes billing so the stagger animation
                replays when the user switches billing period.
              */}
              <ul
                key={billing}
                className="mb-6 flex flex-1 flex-col gap-2.5 text-[14px]"
                style={{ listStyle: 'none', padding: 0 }}
              >
                {tier.features.map((f, fi) => (
                  <FeatureRow key={f} feature={f} idx={fi} />
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={`btn ${tier.highlighted ? 'btn-primary' : 'btn-secondary'} btn-block`}
                style={{ marginTop: 'auto' }}
              >
                {isQuote ? 'Nous contacter' : 'Commencer'}
                {!isQuote && (
                  <span aria-hidden style={{ marginLeft: 6, opacity: .75 }}>→</span>
                )}
              </Link>
            </TiltCard>
          )
        })}
      </div>

      {/* Trust strip */}
      <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[12.5px] font-semibold" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>
        {['Sans carte bancaire', 'Annulable à tout moment', 'Migration gratuite', 'Support inclus'].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <Check className="size-3" strokeWidth={3} style={{ color: 'var(--organic-sage-600)' }} />
            {t}
          </span>
        ))}
      </div>
    </section>
  )
}
