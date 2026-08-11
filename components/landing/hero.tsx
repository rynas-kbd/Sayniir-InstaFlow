'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CHANNELS } from '@/lib/landing-content'

const ROTATE_INTERVAL_MS = 2800

function RotatingChannel({ text }: { text: string }) {
  return (
    <span className="relative inline-block h-[1.18em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block whitespace-nowrap font-extrabold tracking-tight"
          style={{ color: 'var(--organic-terracotta)' }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
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
    <section className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center py-12">
      {/* Background glowing gradient orbs */}
      <div
        className="lp-float pointer-events-none absolute -top-[160px] right-0 z-[-1] size-[420px] rounded-full"
        style={{
          background: 'radial-gradient(closest-side, color-mix(in srgb, var(--organic-sage-300) 45%, transparent), transparent)',
          animation: 'floatSlow 14s ease-in-out infinite',
        }}
      />
      <div
        className="lp-float pointer-events-none absolute top-10 -left-[140px] z-[-1] size-[320px] rounded-full"
        style={{
          background: 'radial-gradient(closest-side, color-mix(in srgb, var(--organic-terracotta-200) 65%, transparent), transparent)',
          animation: 'floatSlow 18s ease-in-out -6s infinite',
        }}
      />

      <div className="lp-hero-grid grid grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] items-center gap-[clamp(24px,5vw,64px)]">
        <div>
          {/* Real-time status pill */}
          <span
            className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 text-[12.5px] font-semibold shadow-xs"
            style={{
              borderColor: 'var(--organic-terracotta-300)',
              background: 'color-mix(in srgb, var(--organic-terracotta-100) 80%, transparent)',
              animation: 'fadeUp .6s ease both',
            }}
          >
            <span className="relative grid size-[9px] place-items-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--organic-sage-600)', animation: 'pulseRing 2.4s ease-out infinite' }}
              />
            </span>
            <span className="font-extrabold" style={{ color: 'var(--organic-text)' }}>1 482</span>
            <span style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
              DM traités dans la dernière heure
            </span>
          </span>

          {/* Heading with rotating channel */}
          <h1
            className="mt-6 font-heading text-[clamp(36px,4.5vw,62px)] font-extrabold leading-[1.12] tracking-tight"
            style={{ animation: 'fadeUp .6s .04s ease both' }}
          >
            <span className="block">Vendez sur</span>
            <RotatingChannel text={CHANNELS[channelIndex]} />
            <span className="block">pendant que vous dormez.</span>
          </h1>

          <p className="mt-6 max-w-[48ch] text-[17.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 78%, transparent)', animation: 'fadeUp .6s .12s ease both' }}>
            Une IA formée sur votre marque répond à chaque message avec votre voix, qualifie l&apos;acheteur et classe
            le lead dans votre CRM — sur Instagram, WhatsApp et Messenger.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5" style={{ animation: 'fadeUp .6s .2s ease both' }}>
            <Link href="/register" className="btn btn-primary h-[46px] px-6 text-[14px]">
              Essai gratuit →
            </Link>
            <a href="#product" className="btn btn-secondary h-[46px] px-6 text-[14px]">
              Voir la démo
            </a>
          </div>

          <div className="mt-7 flex items-center gap-3" style={{ animation: 'fadeUp .6s .28s ease both' }}>
            <span className="flex">
              <span
                className="grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold shadow-xs"
                style={{ background: 'var(--organic-terracotta-300)', borderColor: 'var(--organic-bg)', color: 'var(--organic-terracotta-900)' }}
              >
                DK
              </span>
              <span
                className="-ml-[9px] grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold shadow-xs"
                style={{ background: 'var(--organic-sage-300)', borderColor: 'var(--organic-bg)', color: 'var(--organic-sage-900)' }}
              >
                TR
              </span>
              <span
                className="-ml-[9px] grid size-[30px] place-content-center rounded-full border-2 text-[11px] font-bold shadow-xs"
                style={{ background: 'var(--organic-sand-300)', borderColor: 'var(--organic-bg)' }}
              >
                PS
              </span>
            </span>
            <span className="text-[13px] font-medium leading-[1.4]" style={{ color: 'color-mix(in srgb, var(--organic-text) 68%, transparent)' }}>
              Plan gratuit à vie · sans carte · en ligne en 10 minutes
            </span>
          </div>

          {/* Scroll down indicator */}
          <div className="mt-10 flex items-start" style={{ animation: 'fadeUp .6s .38s ease both' }}>
            <a
              href="#product"
              aria-label="Voir la démo"
              className="inline-flex items-center gap-2 text-[11.5px] font-bold tracking-[.08em] uppercase no-underline hover:opacity-80 transition-opacity"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}
            >
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'scrollBounce 1.8s ease-in-out infinite' }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              <span>Découvrir</span>
            </a>
          </div>
        </div>

        {/* Right side floating message cards */}
        <div className="relative min-h-[440px] w-full" style={{ animation: 'fadeUp .7s .18s ease both' }}>
          <div
            className="lp-float absolute top-2 left-0 max-w-[86%] rounded-2xl rounded-bl-xs border-[1.5px] p-4 text-sm leading-[1.5]"
            style={{
              background: 'var(--organic-bg)',
              borderColor: 'color-mix(in srgb, var(--organic-text) 12%, transparent)',
              boxShadow: '0 6px 20px rgba(0,0,0,.06)',
              animation: 'floatSlow 13s ease-in-out infinite',
            }}
          >
            <span className="mb-1 block text-[10.5px] font-extrabold tracking-[.09em] uppercase" style={{ color: 'var(--organic-terracotta-700)' }}>
              Instagram · @maya
            </span>
            Vous livrez au Canada avant le 14 ?
          </div>

          <div
            className="lp-float absolute top-[124px] right-0 max-w-[88%] rounded-2xl rounded-br-xs p-4 text-sm leading-[1.5]"
            style={{
              background: 'var(--organic-terracotta-700)',
              color: '#fff',
              boxShadow: '0 10px 28px rgba(0,0,0,.14)',
              animation: 'floatSlow 16s ease-in-out -4s infinite',
            }}
          >
            <span className="mb-1 block text-[10.5px] font-extrabold tracking-[.09em] uppercase" style={{ color: 'var(--organic-terracotta-200)' }}>
              Instaflow IA · 1.9s
            </span>
            Oui — 3 à 5 jours, ça arrivera à temps. Je vous envoie le lien ?
          </div>

          <div
            className="lp-float absolute top-[256px] left-[6%] inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] font-bold"
            style={{
              background: 'var(--organic-sage-100)',
              color: 'var(--organic-sage-900)',
              borderColor: 'var(--organic-sage-300)',
              boxShadow: '0 4px 14px rgba(0,0,0,.05)',
              animation: 'floatSlow 14s ease-in-out -9s infinite',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Lead capturé → HubSpot
          </div>

          <div
            className="lp-float absolute top-[330px] right-[4%] rounded-2xl border-[1.5px] px-5 py-3.5"
            style={{
              background: 'var(--organic-bg)',
              borderColor: 'var(--organic-terracotta-300)',
              boxShadow: '0 6px 20px rgba(0,0,0,.06)',
              animation: 'floatSlow 18s ease-in-out -12s infinite',
            }}
          >
            <div className="font-heading text-[28px] font-extrabold leading-none" style={{ color: 'var(--organic-terracotta-700)' }}>+38%</div>
            <div className="mt-1 text-[11px] font-bold tracking-[.06em] uppercase" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
              Hausse de conversion
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
