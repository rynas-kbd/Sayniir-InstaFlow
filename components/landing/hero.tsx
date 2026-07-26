'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CHANNELS } from '@/lib/landing-content'

const ROTATE_INTERVAL_MS = 2600

/** Renders one rotating channel name, shrinking it just enough to always fit on a single
 *  line — never wraps, never overflows, never clips — instead of a fixed font-size that
 *  works for short phrases but cuts off longer ones like "WhatsApp chats". */
function RotatingChannel({ text }: { text: string }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const container = containerRef.current
    const el = textRef.current
    if (!container || !el) return
    const available = container.clientWidth
    const needed = el.scrollWidth
    setScale(needed > available ? available / needed : 1)
  }, [text])

  return (
    <span ref={containerRef} className="block h-[1.04em] overflow-hidden">
      <span
        ref={textRef}
        className="inline-block"
        style={{
          color: 'var(--organic-terracotta-700)',
          whiteSpace: 'nowrap',
          transform: `scale(${scale})`,
          transformOrigin: 'left center',
          animation: 'popIn .5s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        {text}
      </span>
    </span>
  )
}

export function Hero() {
  const [channelIndex, setChannelIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setChannelIndex((i) => (i + 1) % CHANNELS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative flex min-h-[calc(100dvh-64px)] flex-col justify-center py-10">
      <div
        className="lp-float pointer-events-none absolute -top-[220px] z-[-1] size-[420px] rounded-full"
        style={{
          right: 'min(0px, calc(100% - 420px))',
          background: 'radial-gradient(closest-side, var(--organic-sage-200), color-mix(in srgb, var(--organic-sage-200) 30%, transparent))',
          animation: 'floatSlow 14s ease-in-out infinite',
        }}
      />
      <div
        className="lp-float pointer-events-none absolute top-10 -left-[180px] z-[-1] size-[300px] rounded-full"
        style={{
          background: 'radial-gradient(closest-side, var(--organic-terracotta-200), transparent)',
          animation: 'floatSlow 18s ease-in-out -6s infinite',
        }}
      />

      <div className="lp-hero-grid grid grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] items-center gap-[clamp(24px,5vw,64px)]">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-3 text-[13px] font-bold"
            style={{
              borderColor: 'var(--organic-terracotta-300)',
              background: 'color-mix(in srgb, var(--organic-terracotta-100) 70%, transparent)',
              animation: 'fadeUp .6s ease both',
            }}
          >
            <span className="relative grid size-[9px] place-items-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--organic-sage-600)', animation: 'pulseRing 2.4s ease-out infinite' }}
              />
            </span>
            <span data-count>1,482</span>
            <span className="font-semibold" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>
              DMs answered in the last hour
            </span>
          </span>

          <h1
            className="mt-[22px] font-heading text-[clamp(42px,5.4vw,72px)] leading-[1.04]"
            style={{ marginLeft: '-0.028em', animation: 'fadeUp .6s .04s ease both' }}
          >
            <span className="block">Sell in the</span>
            <RotatingChannel key={channelIndex} text={CHANNELS[channelIndex]} />
            <span className="block">while you sleep.</span>
          </h1>

          <p className="mt-[26px] max-w-[50ch] text-[18px] leading-[1.65]" style={{ animation: 'fadeUp .6s .12s ease both' }}>
            An AI trained on your brand answers every message in your voice, qualifies the buyer, and files
            the lead in your CRM — across Instagram, WhatsApp and Messenger.
          </p>

          <div className="mt-8 flex flex-wrap gap-3" style={{ animation: 'fadeUp .6s .2s ease both' }}>
            <Link href="/register" className="btn btn-primary h-[45px] w-[124px]">
              Book a demo
            </Link>
            <a href="#product" className="btn btn-secondary h-[45px] px-[22px]">
              See it run
            </a>
          </div>

          <div className="mt-[26px] flex items-center gap-3" style={{ animation: 'fadeUp .6s .28s ease both' }}>
            <span className="flex">
              <span
                className="grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold"
                style={{ background: 'var(--organic-terracotta-300)', borderColor: 'var(--organic-bg)', color: 'var(--organic-terracotta-900)' }}
              >
                DK
              </span>
              <span
                className="-ml-[9px] grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold"
                style={{ background: 'var(--organic-sage-300)', borderColor: 'var(--organic-bg)', color: 'var(--organic-sage-900)' }}
              >
                TR
              </span>
              <span
                className="-ml-[9px] grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold"
                style={{ background: 'var(--organic-sand-300)', borderColor: 'var(--organic-bg)' }}
              >
                PS
              </span>
            </span>
            <span className="text-[13.5px] leading-[1.4]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
              Free forever plan · no card · live in 10 minutes
            </span>
          </div>
        </div>

        <div className="relative min-h-[420px]" style={{ animation: 'fadeUp .7s .18s ease both' }}>
          <div
            className="lp-float absolute top-3 left-0 max-w-[86%] rounded-[20px] rounded-bl-[6px] border-[1.5px] p-[12px_15px] text-sm leading-[1.5]"
            style={{ background: 'var(--organic-bg)', borderColor: 'var(--organic-sand-300)', boxShadow: 'var(--organic-shadow-md)', animation: 'floatSlow 13s ease-in-out infinite' }}
          >
            <span className="mb-1 block text-[10.5px] font-bold tracking-[.09em] uppercase" style={{ color: 'var(--organic-terracotta-700)' }}>
              Instagram · @maya
            </span>
            Do you ship to Canada by the 14th?
          </div>
          <div
            className="lp-float absolute top-[124px] right-0 max-w-[88%] rounded-[20px] rounded-br-[6px] p-[12px_15px] text-sm leading-[1.5]"
            style={{ background: 'var(--organic-terracotta-700)', color: 'var(--organic-terracotta-100)', boxShadow: 'var(--organic-shadow-lg)', animation: 'floatSlow 16s ease-in-out -4s infinite' }}
          >
            <span className="mb-1 block text-[10.5px] font-bold tracking-[.09em] uppercase" style={{ color: 'var(--organic-terracotta-300)' }}>
              Instaflow AI · 1.9s
            </span>
            Yes — 3–5 days, so it lands in time. Want the link?
          </div>
          <div
            className="lp-float absolute top-[250px] left-[8%] inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-[12.5px] font-bold"
            style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-900)', boxShadow: 'var(--organic-shadow-sm)', animation: 'floatSlow 14s ease-in-out -9s infinite' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Lead captured → HubSpot
          </div>
          <div
            className="lp-float absolute top-[322px] right-[4%] rounded-[20px] border-[1.5px] px-[18px] py-[14px]"
            style={{ background: 'var(--organic-bg)', borderColor: 'var(--organic-terracotta-300)', boxShadow: 'var(--organic-shadow-md)', animation: 'floatSlow 18s ease-in-out -12s infinite' }}
          >
            <div className="font-heading text-[26px] leading-none">+38%</div>
            <div className="mt-0.5 text-[11px] font-bold tracking-[.06em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
              Conversion lift
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
