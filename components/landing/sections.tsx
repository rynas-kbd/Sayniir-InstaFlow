"use client"

import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import {
  LOGO_STRIP,
  METRICS,
  FEATURES,
  CHANNEL_INFO,
  TESTIMONIALS,
  COMPARISON_ROWS,
  FAQ_ITEMS,
} from '@/lib/landing-content'
import { SectionHeader } from './chrome'
import { SpatialCard } from './spatial-card'
import { Phone3DCanvas } from './phone-3d-canvas'

const TONE_ICON_BG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-100)',
  s: 'var(--organic-sage-100)',
}
const TONE_ICON_FG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-600)',
  s: 'var(--organic-sage-700)',
}
const TONE_AVATAR_BG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-200)',
  s: 'var(--organic-sage-200)',
}
const TONE_AVATAR_FG: Record<'a' | 's', string> = {
  a: 'var(--organic-terracotta-800)',
  s: 'var(--organic-sage-800)',
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14,
    },
  },
}

/** Animates a numeric value from 0 up to `target` once the element is in view */
function useCountUp(target: number, duration = 1.4, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration, decimals])

  return { ref, value }
}

export function LogoMarquee() {
  const loop = [...LOGO_STRIP, ...LOGO_STRIP, ...LOGO_STRIP, ...LOGO_STRIP]
  return (
    <section className="pb-16 pt-8">
      <p
        className="mb-5 text-xs font-bold tracking-[.1em] uppercase text-center flex items-center justify-center gap-2"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}
      >
        <span>INTÉGRATIONS NATIVES — APIS OFFICIELLES META</span>
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>ADOPTÉ PAR +12 000 ÉQUIPES</span>
      </p>
      <div className="lp-marquee opacity-90 hover:opacity-100 transition-opacity">
        <div
          className="flex w-max items-center gap-10 sm:gap-16"
          style={{ animation: 'marquee 28s linear infinite' }}
        >
          {loop.map((item, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md shadow-sm transition-all hover:scale-105 hover:shadow-md"
              style={{
                borderColor: `${item.accentColor}45`,
                backgroundColor: `${item.accentColor}14`,
              }}
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                dangerouslySetInnerHTML={{ __html: item.svgContent }}
              />
              <span
                className="font-heading text-sm font-bold tracking-tight"
                style={{ color: 'var(--organic-text)' }}
              >
                {item.name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MetricsBand() {
  return (
    <section className="pb-[88px]">
      <div data-reveal-group className="lp-stagger grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        {METRICS.map((m) => (
          <div
            key={m.label}
            data-reveal
            className="pl-[18px]"
            style={{ borderLeft: '2.5px solid var(--organic-terracotta)' }}
          >
            <div data-count className="font-heading text-[clamp(34px,3.2vw,46px)] leading-[1.1]">
              {m.value}
            </div>
            <div
              className="mt-1.5 text-[13px] font-semibold tracking-[.06em] uppercase"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Combined trust section: logo marquee + animated metrics band.
 *  Matches the clean design from commit 6d3cfffa — no terminal-style labels. */
export function CommandCenterTrust() {
  const loop = [...LOGO_STRIP, ...LOGO_STRIP]

  // Each metric: target number, display formatter, label
  const metrics = [
    {
      label: 'DM traités / mois',
      target: 2.4,
      decimals: 1,
      format: (v: number) => `${v.toFixed(1)}M+`,
      duration: 1.8,
    },
    {
      label: 'Taux de réponse IA',
      target: 98,
      decimals: 0,
      format: (v: number) => `${Math.round(v)}%`,
      duration: 1.6,
    },
    {
      label: 'Temps de réponse',
      target: 1.4,
      decimals: 1,
      format: (v: number) => `<${v.toFixed(1)}s`,
      duration: 1.4,
    },
    {
      label: 'Équipes actives',
      target: 12,
      decimals: 0,
      format: (v: number) => `${Math.round(v)}k+`,
      duration: 1.8,
    },
  ]

  return (
    <section className="pb-24 pt-8 relative flex flex-col items-center">
      {/* Trust headline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 text-xs font-bold tracking-[.1em] uppercase text-center"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
      >
        Fait confiance par 12 000+ marques, agences &amp; e-commerçants
      </motion.p>

      {/* Logo marquee */}
      <div className="lp-marquee mb-14 w-full opacity-85 hover:opacity-100 transition-opacity">
        <div
          className="flex w-max items-center gap-[clamp(24px,4vw,56px)]"
          style={{ animation: 'marquee 36s linear infinite' }}
        >
          {loop.map((item, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md shadow-sm transition-all hover:scale-105"
              style={{
                borderColor: `${item.accentColor}45`,
                backgroundColor: `${item.accentColor}14`,
              }}
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                dangerouslySetInnerHTML={{ __html: item.svgContent }}
              />
              <span
                className="font-heading text-sm font-bold tracking-tight"
                style={{ color: 'var(--organic-text)' }}
              >
                {item.name}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Metrics band — animated count-up */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-10%' }}
        className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 w-full"
      >
        {metrics.map((m) => (
          <AnimatedMetric key={m.label} {...m} />
        ))}
      </motion.div>
    </section>
  )
}

/** Single animated metric card — counts up from 0 once in view */
function AnimatedMetric({
  label,
  target,
  decimals,
  format,
  duration,
}: {
  label: string
  target: number
  decimals: number
  format: (v: number) => string
  duration: number
}) {
  const { ref, value } = useCountUp(target, duration, decimals)

  return (
    <motion.div
      variants={cardVariants}
      className="pl-[18px]"
      style={{ borderLeft: '2.5px solid var(--organic-terracotta)' }}
    >
      <span
        ref={ref}
        className="block font-heading text-[clamp(34px,3.2vw,46px)] leading-[1.1] tabular-nums"
      >
        {format(value)}
      </span>
      <div
        className="mt-1.5 text-[13px] font-semibold tracking-[.06em] uppercase"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
      >
        {label}
      </div>
    </motion.div>
  )
}

export function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  const isActive = useRef(false)
  const cooldown = useRef(false)
  const activeIdxRef = useRef(0)
  activeIdxRef.current = activeIdx

  // IntersectionObserver: section active while any part is intersecting
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        isActive.current = entry.isIntersecting
        // Reset to first feature when section exits viewport downward
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setActiveIdx(FEATURES.length - 1)
        }
        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          setActiveIdx(0)
        }
      },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const goTo = useCallback((nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= FEATURES.length) return
    setDirection(nextIdx > activeIdxRef.current ? 1 : -1)
    setActiveIdx(nextIdx)

    // Synchronize window scroll position to match the feature index within section height
    if (sectionRef.current) {
      const secTop = sectionRef.current.offsetTop
      const secHeight = sectionRef.current.offsetHeight
      const stepHeight = (secHeight - window.innerHeight) / (FEATURES.length - 1)
      const targetY = secTop + nextIdx * stepHeight
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }

    cooldown.current = true
    setTimeout(() => { cooldown.current = false }, 450)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let touchStartY = 0

    const onWheel = (e: WheelEvent) => {
      if (!isActive.current) return
      const idx = activeIdxRef.current

      // At last module (Module 06): 1 single scroll down smoothly exits section
      if (e.deltaY > 0 && idx >= FEATURES.length - 1) {
        e.preventDefault()
        if (cooldown.current) return
        cooldown.current = true
        setTimeout(() => { cooldown.current = false }, 500)

        if (sectionRef.current) {
          const secBottom = sectionRef.current.offsetTop + sectionRef.current.offsetHeight
          window.scrollTo({ top: secBottom + 20, behavior: 'smooth' })
        }
        return
      }

      // At first module (Module 01): 1 single scroll up exits section upward
      if (e.deltaY < 0 && idx <= 0) {
        e.preventDefault()
        if (cooldown.current) return
        cooldown.current = true
        setTimeout(() => { cooldown.current = false }, 500)

        if (sectionRef.current) {
          const secTop = sectionRef.current.offsetTop
          window.scrollTo({ top: secTop - window.innerHeight, behavior: 'smooth' })
        }
        return
      }

      // Block page scroll for ALL intermediate modules
      e.preventDefault()
      if (cooldown.current) return

      if (e.deltaY > 0) goTo(idx + 1)
      else goTo(idx - 1)
    }

    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }

    const onTouchMove = (e: TouchEvent) => {
      if (!isActive.current) return
      const dy = touchStartY - e.touches[0].clientY
      if (Math.abs(dy) < 30) return
      const idx = activeIdxRef.current

      if (dy > 0 && idx >= FEATURES.length - 1) {
        e.preventDefault()
        if (cooldown.current) return
        cooldown.current = true
        setTimeout(() => { cooldown.current = false }, 500)

        if (sectionRef.current) {
          const secBottom = sectionRef.current.offsetTop + sectionRef.current.offsetHeight
          window.scrollTo({ top: secBottom + 20, behavior: 'smooth' })
        }
        return
      }

      if (dy < 0 && idx <= 0) {
        e.preventDefault()
        if (cooldown.current) return
        cooldown.current = true
        setTimeout(() => { cooldown.current = false }, 500)

        if (sectionRef.current) {
          const secTop = sectionRef.current.offsetTop
          window.scrollTo({ top: secTop - window.innerHeight, behavior: 'smooth' })
        }
        return
      }

      e.preventDefault()
      if (cooldown.current) return
      if (dy > 0) goTo(idx + 1)
      else goTo(idx - 1)
      touchStartY = e.touches[0].clientY
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [goTo])

  // Midnight Sapphire Aura — 2-layer atmospheric gradient, color per feature
  const PALETTES = [
    // 01 — DM IA : terracotta warm
    { c1: 'rgba(200,90,60,0.18)', c2: 'rgba(160,55,35,0.28)', accent: '#c8573c' },
    // 02 — Catalogue : sage green
    { c1: 'rgba(74,124,89,0.18)', c2: 'rgba(50,95,65,0.28)', accent: '#4a7c59' },
    // 03 — Relance panier : amber
    { c1: 'rgba(200,140,40,0.18)', c2: 'rgba(160,100,20,0.28)', accent: '#c88c28' },
    // 04 — CRM : indigo
    { c1: 'rgba(80,100,210,0.18)', c2: 'rgba(50,70,170,0.28)', accent: '#5064d2' },
    // 05 — Campagnes : rose
    { c1: 'rgba(190,60,110,0.18)', c2: 'rgba(150,35,80,0.28)', accent: '#be3c6e' },
    // 06 — Analytics : teal
    { c1: 'rgba(30,160,160,0.18)', c2: 'rgba(15,120,120,0.28)', accent: '#1ea0a0' },
  ]

  const feature = FEATURES[activeIdx]
  const palette = PALETTES[activeIdx]
  const numStr = `0${activeIdx + 1}`

  const selectIdx = (targetIdx: number) => {
    setDirection(targetIdx > activeIdx ? 1 : -1)
    setActiveIdx(targetIdx)
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-screen left-1/2 -translate-x-1/2 border-y border-[var(--organic-divider)]"
      style={{ height: `${FEATURES.length * 100}vh` }}
    >
      {/* Viewport Docked to Top Edge Under Floating Navbar */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between pt-16 pb-6 px-4 md:px-10 relative">
        
        {/* Midnight Sapphire Aura — 2-layer atmospheric gradient system */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#050507]">
          {/* Aura Layer 1 — broad atmospheric diffusion */}
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: `linear-gradient(170deg, rgba(0,0,0,0) 0%, ${palette.c1} 28%, rgba(5,5,7,0.6) 60%, ${palette.c2} 82%, rgba(3,3,5,0.95) 100%)`,
              filter: 'blur(130px)',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />
          {/* Aura Layer 2 — concentrated inner bloom */}
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: `linear-gradient(185deg, rgba(0,0,0,0) 0%, ${palette.c2} 34%, rgba(5,5,7,0.4) 55%, ${palette.c1} 78%, rgba(3,3,5,0.9) 100%)`,
              filter: 'blur(90px)',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Subtle Minimal Progress Indicator */}
        <div className="flex items-center justify-between z-20 max-w-[1400px] mx-auto w-full text-[12px] font-mono font-bold text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">
          <span className="text-[var(--organic-terracotta)] font-extrabold uppercase tracking-wider">
            Module {numStr} / 06
          </span>
          <span>Défilez pour explorer ↓</span>
        </div>

        {/* Fullscreen Horizontal Slide Stage with Dezoom & 3D Perspective Motion */}
        <div className="flex-1 flex items-center justify-center my-auto w-full max-w-[1400px] mx-auto z-10 relative min-h-[460px] sm:min-h-[520px]">
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={activeIdx}
              custom={direction}
              initial={{
                x: direction > 0 ? '75vw' : '-75vw',
                scale: 0.65,
                opacity: 0,
                rotateY: direction > 0 ? 30 : -30,
              }}
              animate={{
                x: '0vw',
                scale: 1,
                opacity: 1,
                rotateY: 0,
              }}
              exit={{
                x: direction > 0 ? '-75vw' : '75vw',
                scale: 0.65,
                opacity: 0,
                rotateY: direction > 0 ? -30 : 30,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-10 w-full h-full"
            >
              {/* Left Column: Character Lore & Bio (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-center order-2 lg:order-1 space-y-2.5 z-20">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full border shadow-sm"
                    style={{
                      background: `color-mix(in srgb, ${palette.accent} 18%, transparent)`,
                      color: palette.accent,
                      borderColor: `color-mix(in srgb, ${palette.accent} 40%, transparent)`,
                    }}
                  >
                    MODULE 0{activeIdx + 1}
                  </span>
                  <span className="text-[11px] font-mono text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)] font-bold">
                    [ 0{activeIdx + 1} / 06 ]
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-[clamp(22px,2.2vw,34px)] leading-[1.08] text-[var(--organic-text)] tracking-tight">
                  {feature.title}
                </h3>

                <div
                  className="h-[2px] w-12 rounded-full my-1"
                  style={{ background: palette.accent }}
                />

                <p className="text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--organic-text)_78%,transparent)] font-medium">
                  {feature.body}
                </p>
              </div>

              {/* Center Column: MASSIVE HERO 3D PHONE CHARACTER (6 cols) */}
              <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2 z-30">
                <div className="w-full max-w-[540px] sm:max-w-[640px] h-[540px] sm:h-[680px] relative rounded-3xl p-2 flex items-center justify-center">
                  <Phone3DCanvas activeIdx={activeIdx} accentColor={palette.accent} />
                </div>
              </div>

              {/* Right Column: Character Stats & Attributes HUD (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-center order-3 space-y-3 z-20">
                {/* Directive de Ton Card for Feature 1 */}
                {activeIdx === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-2xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold text-xs">
                      <span className="text-lg">🌿</span>
                      <span className="font-mono tracking-wider uppercase text-[10px]">TON // BOTANIQUE</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-200/90 font-medium">
                      "Répond toujours de manière chaleureuse avec émoticônes botaniques 🌿, propose les promotions et tutoie poliment."
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/60 backdrop-blur-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-zinc-200">STATISTIQUES</span>
                      <span className="text-emerald-400 font-bold">● ACTIF</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                        <span className="block font-heading font-extrabold text-lg text-white">+42.8K€</span>
                        <span className="text-[9px] text-zinc-400 font-mono uppercase">IMPACT CA</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                        <span className="block font-heading font-extrabold text-lg text-emerald-400">&lt; 0.8s</span>
                        <span className="text-[9px] text-zinc-400 font-mono uppercase">VITESSE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Call to Action Button */}
                <div className="pt-1">
                  <Link
                    href="/register"
                    className="w-full py-3 px-5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-white font-mono"
                    style={{ backgroundColor: palette.accent }}
                  >
                    Activer Module #{numStr} →
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Arena Dots Navigation */}
        <div className="flex items-center justify-center gap-2.5 z-20 max-w-[1400px] mx-auto w-full">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => selectIdx(i)}
              className="h-2.5 rounded-full transition-all duration-300"
              style={{
                width: activeIdx === i ? '36px' : '10px',
                backgroundColor: activeIdx === i ? palette.accent : 'color-mix(in srgb, var(--organic-text) 25%, transparent)',
              }}
              aria-label={`Module ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Render custom interactive visual mockups inside the spacious App Window simulator */
function FeatureGraphic({ index, accent }: { index: number; accent: string }) {
  switch (index) {
    case 0:
      // Pillar 1: IA Entraînée & Active — Brand Tone & DM Simulator
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center font-bold text-[14px] text-white shadow-sm" style={{ background: accent }}>
                🌿
              </div>
              <div>
                <div className="font-heading font-bold text-[14px] leading-tight text-[var(--organic-text)]">
                  Agent IA · Synchro Directe
                </div>
                <div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> 100% Fidèle à la Marque
                </div>
              </div>
            </div>
            <span className="text-[10.5px] font-mono font-bold uppercase px-3 py-1 rounded-lg border" style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`, color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)` }}>
              Réponse &lt; 0.8s
            </span>
          </div>

          {/* Tone Directive Hero Box */}
          <div className="rounded-xl p-3.5 border space-y-1 backdrop-blur-sm" style={{ background: `color-mix(in srgb, ${accent} 7%, var(--organic-surface))`, borderColor: `color-mix(in srgb, ${accent} 25%, transparent)` }}>
            <span className="font-heading font-extrabold text-[10px] uppercase tracking-wider block" style={{ color: accent }}>
              Directive de Ton de Marque
            </span>
            <p className="text-[13px] text-[var(--organic-text)] italic leading-relaxed">
              "Réponds toujours de manière chaleureuse avec émoticônes botaniques, propose les promotions en cours et tutoie poliment."
            </p>
          </div>

          {/* Real DM Conversation Bubbles */}
          <div className="space-y-3 my-auto">
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-xs px-4 py-3 bg-[color-mix(in_srgb,var(--organic-text)_6%,transparent)] border border-[var(--organic-divider)] text-[12.5px] leading-relaxed text-[var(--organic-text)]">
                Bonjour ! Vos vases en céramique artisanale conviennent pour des fleurs fraîches ?
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-3 text-[12.5px] leading-relaxed text-[var(--organic-text)] border" style={{ background: `color-mix(in srgb, ${accent} 12%, var(--organic-surface))`, borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}>
                Coucou Amélie ! 👋 Oui tout à fait, ils sont 100% étanches. Profite de nos -15% printaniers avec le code <strong>BOTANIK15</strong> 🌸
              </div>
            </div>
          </div>

          {/* Metric Pill Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--organic-divider)]">
            <div className="p-3 rounded-xl bg-[var(--organic-surface)] border border-[var(--organic-divider)] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Respect de marque</div>
                <div className="font-heading font-extrabold text-[18px] text-[var(--organic-text)]">100%</div>
              </div>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">Vérifié ✓</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--organic-surface)] border border-[var(--organic-divider)] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)] font-mono">Hallucinations</div>
                <div className="font-heading font-extrabold text-[18px] text-[var(--organic-text)]">0</div>
              </div>
              <span className="text-[11px] font-mono text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Base FAQ</span>
            </div>
          </div>
        </div>
      )

    case 1:
      // Pillar 2: Studio No-Code — Visual Flow Canvas
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">
              Éditeur de Scénarios No-Code
            </div>
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-lg border border-[var(--organic-divider)] text-[color-mix(in_srgb,var(--organic-text)_65%,transparent)]">
              5 Nœuds Actifs
            </span>
          </div>

          {/* Flow Steps Canvas */}
          <div className="space-y-3 my-auto">
            {[
              { step: 'TRIGGER', title: 'Mot-clé DM "PROMO"', desc: 'Entrée Instagram & Story reply', color: '#e7b33d' },
              { step: 'IA AGENT', title: 'Qualification & Analyse', desc: 'Détection du produit & profil client', color: accent },
              { step: 'ACTION', title: 'Lien Panier Direct', desc: 'Envoi du panier -10% en 1-clic', color: '#38bdf8' },
            ].map(({ step, title, desc, color }, i, arr) => (
              <React.Fragment key={step}>
                <div className="p-3.5 rounded-xl border bg-[var(--organic-surface)] flex items-center justify-between shadow-sm transition-all hover:translate-x-1" style={{ borderColor: `color-mix(in srgb, ${color} 30%, var(--organic-divider))` }}>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded font-mono font-extrabold text-[9.5px] uppercase" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                      {step}
                    </span>
                    <div>
                      <div className="font-heading font-bold text-[13px] text-[var(--organic-text)]">{title}</div>
                      <div className="text-[11px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">{desc}</div>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold" style={{ color }}>✓</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-[1.5px] h-3 ml-6 bg-[var(--organic-divider)]" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="p-3 rounded-xl border text-center font-mono text-[11px] bg-[var(--organic-surface)] border-[var(--organic-divider)] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">
            Glissez, déposez, publiez — Aucun code nécessaire
          </div>
        </div>
      )

    case 2:
      // Pillar 3: Capture CRM — Rich Contact Dashboard
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">
              Fiche Client CRM Enrichie
            </div>
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold">
              Lead Chaud 🔥
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[var(--organic-surface)] space-y-3 shadow-sm" style={{ borderColor: 'var(--organic-divider)' }}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl font-heading font-extrabold flex items-center justify-center text-[16px] border" style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent, borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}>
                  M
                </div>
                <div>
                  <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">Maya Lin</div>
                  <div className="text-[11px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">@homefolk · Lyon, France</div>
                </div>
              </div>
              <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-md border border-[var(--organic-divider)] text-[var(--organic-text)]">
                Shopify Synchro ✓
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <div className="text-[10.5px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Intention d'achat :</div>
                <div className="font-heading font-bold text-[var(--organic-text)] mt-0.5">Vase Terre Cuite 68€</div>
              </div>
              <div>
                <div className="text-[10.5px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Tag CRM :</div>
                <div className="font-mono text-[11px] font-bold text-emerald-500 mt-0.5">Opt-in Klaviyo Verified ✓</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border text-center font-mono text-[11px] bg-[var(--organic-surface)] border-[var(--organic-divider)] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">
            Mise à jour en temps réel lors de chaque échange
          </div>
        </div>
      )

    case 3:
      // Pillar 4: Relance Panier — Automated Campaign Simulator
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">
              Relance Panier Abandonné
            </div>
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold">
              Conforme Meta
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[var(--organic-surface)] space-y-3 shadow-sm" style={{ borderColor: 'var(--organic-divider)' }}>
            <div className="flex items-center justify-between text-[11px] font-mono text-[color-mix(in_srgb,var(--organic-text)_55%,transparent)]">
              <span>Déclenchement : 2h après abandon</span>
              <span className="text-emerald-500 font-bold">Envoyé ✓</span>
            </div>
            <div className="p-3.5 rounded-lg text-[13px] leading-relaxed border bg-[var(--organic-bg)] border-[var(--organic-divider)] text-[var(--organic-text)]">
              "Coucou Lucas ! Tes articles t'attendent sagement dans ton panier 🧺 CODE: <strong>DM10</strong> pour bénéficier de tes -10% !"
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            {[
              { val: '84%', label: 'Ouverture' },
              { val: '31%', label: 'Conversion' },
              { val: '+18%', label: 'Revenu DM' },
            ].map(({ val, label }) => (
              <div key={label} className="p-2.5 rounded-xl bg-[var(--organic-surface)] border border-[var(--organic-divider)]">
                <div className="font-heading font-extrabold text-[16px] text-[var(--organic-text)]">{val}</div>
                <div className="text-[10px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )

    case 4:
      // Pillar 5: Relay Humain — Shared Team Inbox
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">
              Passage de Relais Équipe
            </div>
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold">
              Relais Humain
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[var(--organic-surface)] space-y-3 shadow-sm" style={{ borderColor: 'var(--organic-divider)' }}>
            <div className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-amber-500">
              Note de Synthèse IA Automatique
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--organic-text)]">
              "Client demande un devis spécifique pour commande de mariage (&gt;20 articles). Transmis à l'équipe commerciale."
            </p>
            <div className="pt-3 border-t border-[var(--organic-divider)] flex items-center justify-between text-[11.5px]">
              <span className="text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Attribuer à la conversation :</span>
              <span className="font-heading font-bold text-[var(--organic-text)]">Sarah (Manager)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border text-center font-mono text-[11px] bg-[var(--organic-surface)] border-[var(--organic-divider)] text-emerald-500 font-bold">
            Zéro perte d'information lors du transfert
          </div>
        </div>
      )

    case 5:
    default:
      // Pillar 6: Analytics & CA Impact Screen
      return (
        <div className="space-y-4 font-sans text-xs flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--organic-divider)]">
            <div className="font-heading font-bold text-[14px] text-[var(--organic-text)]">
              Impact CA &amp; Croissance
            </div>
            <span className="text-[12px] font-mono font-extrabold text-emerald-500">
              +42 800 € / mois
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[var(--organic-surface)]" style={{ borderColor: 'var(--organic-divider)' }}>
            <div className="h-28 flex items-end gap-2">
              {[40, 52, 65, 58, 80, 92, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <motion.div
                    className="w-full rounded-sm"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background: i === 6 ? accent : `color-mix(in srgb, ${accent} 30%, transparent)`,
                    }}
                  />
                  <span className="text-[9.5px] font-mono text-[color-mix(in_srgb,var(--organic-text)_40%,transparent)]">J{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[var(--organic-surface)] border border-[var(--organic-divider)]">
              <div className="text-[10px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Réponse IA moyenne</div>
              <div className="font-heading font-extrabold text-[15px] text-[var(--organic-text)] mt-0.5">&lt; 3 secondes</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--organic-surface)] border border-[var(--organic-divider)]">
              <div className="text-[10px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">Satisfaction Client</div>
              <div className="font-heading font-extrabold text-[15px] text-[var(--organic-text)] mt-0.5">99.4% Note 🔥</div>
            </div>
          </div>
        </div>
      )
  }
}



export function Channels() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const channelsData = [
    {
      id: 'instagram',
      title: 'DM Instagram',
      subtitle: 'Meta Graph API v19.0 Officielle',
      badge: '● Meta API Graph',
      gradient: 'from-[#f77737] via-[#e1306c] to-[#833ab4]',
      accentColor: '#e1306c',
      glowColor: 'rgba(225, 48, 108, 0.25)',
      description: 'Automatisez vos réponses aux stories, commentaires et DM sans risque de suspension. Transformez vos abonnés en acheteurs.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      tags: ['Stories Auto-Reply', 'Commentaires → DM', 'Achat 1-Clic'],
      metrics: [
        { val: '+138%', label: 'Conversions DM' },
        { val: '0.4s', label: 'Délai moyen' },
      ],
      demo: {
        header: 'botanik_paris ✓',
        status: '● IA En direct · Ton Botanique 🌿',
        userMsg: 'Bonjour ! Avez-vous un code promo pour le sérum bio ? 🌿',
        aiMsg: 'Coucou ! 🌿 Oui ! Profite de -15% aujourd\'hui avec le code BOTANIK15 🛍️',
        actionPill: '🛒 Commande 1-Clic : Sérum Bio (29,90 €)',
      },
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Business API',
      subtitle: 'Meta Cloud API Officielle',
      badge: '● 98% Open Rate',
      gradient: 'from-[#25d366] to-[#128c7e]',
      accentColor: '#25d366',
      glowColor: 'rgba(37, 211, 102, 0.25)',
      description: 'Engagez vos clients sur leur application préférée. Envoyez des relances de panier abandonné et des catalogues interactifs.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      tags: ['Relance Panier Expiré', 'Catalogues WhatsApp', 'Paiement In-App'],
      metrics: [
        { val: '98,4%', label: 'Taux d\'ouverture' },
        { val: '2.4k', label: 'DMs / minute' },
      ],
      demo: {
        header: 'WhatsApp Business · Botanik',
        status: '⚡ Panier Expiré Récupéré',
        userMsg: '⚠️ Votre panier expire dans 14:59 min !',
        aiMsg: 'Vos articles vous attendent. Souhaitez-vous finaliser avec -10% offerts ? 🎁',
        actionPill: 'Pay · Payer 3 500 DA (64,71 €)',
      },
    },
    {
      id: 'messenger',
      title: 'Facebook Messenger',
      subtitle: 'Meta Business Suite',
      badge: '● Réponse < 1s',
      gradient: 'from-[#0084ff] to-[#00c6ff]',
      accentColor: '#0084ff',
      glowColor: 'rgba(0, 132, 255, 0.25)',
      description: 'Convertissez le trafic de vos publicités Click-to-Messenger et résolvez 80%+ des demandes de support sans agent humain.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      tags: ['Click-to-Messenger Ads', 'FAQ 24/7 Auto', 'Capture Lead CRM'],
      metrics: [
        { val: '< 1s', label: 'Temps de réponse' },
        { val: '100%', label: 'Résolution IA' },
      ],
      demo: {
        header: 'Messenger · Support Client',
        status: '● Statut Commande Résolu',
        userMsg: 'Bonjour, où en est ma commande #CMD-10492 ?',
        aiMsg: 'Votre colis Colissimo est en route ! Arrivée prévue demain à 13h 📦',
        actionPill: '✅ Ticket résolu en 0.4s · Note ⭐⭐⭐⭐⭐',
      },
    },
    {
      id: 'shopify',
      title: 'Shopify & E-Commerce',
      subtitle: 'Synchro Directe Produits & Stocks',
      badge: '● Synchro Directe',
      gradient: 'from-[#10b981] to-[#059669]',
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      description: 'Synchronisez votre catalogue produit, vos stocks et vos commandes. Détectez les paniers abandonnés et relancez-les automatiquement.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      tags: ['Stock Synchro In-App', 'Paniers Abandonnés', 'Commandes DA'],
      metrics: [
        { val: '+42.8k DA', label: 'Générés ce mois' },
        { val: '3/3', label: 'Paniers sauvés' },
      ],
      demo: {
        header: 'Boutique Shopify Connectée',
        status: '🛒 3 Paniers Récupérés Aujourd\'hui',
        userMsg: 'Sérum Aloe Vera Bio 50ml · 3 500 DA',
        aiMsg: '✅ Panier réactivé automatiquement via DM (-10% appliqué)',
        actionPill: '🎉 Commande Confirmée & Synchro CRM',
      },
    },
  ]

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = direction === 'left' ? -440 : 440
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const updateActiveIndex = () => {
    if (!scrollRef.current) return
    const scrollPos = scrollRef.current.scrollLeft
    const cardWidth = 440
    const newIdx = Math.round(scrollPos / cardWidth)
    setActiveIndex(Math.min(Math.max(newIdx, 0), channelsData.length - 1))
  }

  return (
    <section className="relative pb-[110px] pt-12 overflow-hidden">
      {/* Background Lighting Halos */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 size-[500px] rounded-full blur-[140px] opacity-15" style={{ background: 'var(--organic-terracotta)' }} />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 size-[500px] rounded-full blur-[140px] opacity-15" style={{ background: '#25d366' }} />

      <SectionHeader kicker="Écosystème Multi-Canal" note="API Meta Officielle · Synchro 1-Clic" />

      {/* Header Row with Title & Scroll Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[22ch] font-heading text-[clamp(28px,3.5vw,46px)] leading-[1.12]"
          >
            Connecté à tout ce que vous utilisez.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 max-w-[56ch] text-base leading-[1.65]"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 74%, transparent)' }}
          >
            Glissez à travers les cartes en lévitation pour découvrir la puissance de chaque canal connecté.
          </motion.p>
        </div>

        {/* Arrow Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleScroll('left')}
            className="grid size-12 place-content-center rounded-2xl border border-border/50 bg-card/80 text-foreground shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-muted active:scale-95 cursor-pointer"
            aria-label="Canal précédent"
          >
            ‹
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="grid size-12 place-content-center rounded-2xl border border-border/50 bg-card/80 text-foreground shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-muted active:scale-95 cursor-pointer"
            aria-label="Canal suivant"
          >
            ›
          </button>
        </div>
      </div>

      {/* Floating 3D Carousel Stage */}
      <div
        ref={scrollRef}
        onScroll={updateActiveIndex}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-8 px-2 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {channelsData.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            animate={{
              y: [0, -6, 0],
            }}
            style={{
              animation: `float-levitate 4s ease-in-out infinite ${i * 0.8}s`,
              borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
              boxShadow: `0 20px 50px -12px ${c.glowColor}`,
            }}
            className="group relative w-[340px] sm:w-[440px] shrink-0 snap-center overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-border hover:shadow-3xl flex flex-col justify-between"
          >
            {/* Top Ambient Glow Halo */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl opacity-25 transition-all duration-500 group-hover:opacity-50 group-hover:scale-110"
              style={{ background: c.accentColor }}
            />

            <div>
              {/* Channel Header Row */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl text-white bg-gradient-to-br ${c.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{c.subtitle}</p>
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border backdrop-blur-md shrink-0"
                  style={{
                    borderColor: `${c.accentColor}40`,
                    color: c.accentColor,
                    backgroundColor: `${c.accentColor}14`,
                  }}
                >
                  {c.badge}
                </span>
              </div>

              {/* Channel Description */}
              <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                {c.description}
              </p>

              {/* Live Interactive Simulation Widget */}
              <div className="rounded-2xl border border-border/40 bg-muted/40 p-4 mb-6 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-2 border-b border-border/30">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full animate-ping" style={{ background: c.accentColor }} />
                    {c.demo.header}
                  </span>
                  <span className="text-emerald-500 font-mono text-[10px]">{c.demo.status}</span>
                </div>

                {/* User Inbound Bubble */}
                <div className="max-w-[88%] self-start rounded-2xl rounded-bl-xs bg-card p-3 text-xs font-medium text-foreground shadow-sm border border-border/30">
                  {c.demo.userMsg}
                </div>

                {/* AI Outbound Bubble */}
                <div
                  className="max-w-[88%] ml-auto rounded-2xl rounded-br-xs p-3 text-xs font-medium text-white shadow-md"
                  style={{ background: c.accentColor }}
                >
                  {c.demo.aiMsg}
                </div>

                {/* Live Action Tag */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground bg-card border border-border/40 rounded-full px-3 py-1 shadow-xs">
                    {c.demo.actionPill}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics & Capabilities Footer */}
            <div>
              {/* 2 KPI Metrics Cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {c.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-border/30 bg-muted/20 p-2.5 text-center">
                    <div className="font-heading font-extrabold text-base text-foreground">{m.val}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/30">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-muted/50 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground border border-border/30"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dots Indicator Below Carousel */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {channelsData.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ left: i * 440, behavior: 'smooth' })
              }
            }}
            className={`size-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === i ? 'w-8 bg-foreground' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
            }`}
            style={{
              background: activeIndex === i ? c.accentColor : undefined,
            }}
            aria-label={`Aller au canal ${c.title}`}
          />
        ))}
      </div>
    </section>
  )
}


export function InboxShowcase() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="L'inbox partagée" note="Boîte d'équipe collaborative" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3 max-w-[22ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        L'IA rédige. Vous validez. Elle apprend.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9 max-w-[56ch] text-base leading-[1.65]"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 76%, transparent)' }}
      >
        Chaque conversation dont l&apos;IA n&apos;est pas sûre arrive ici avec une réponse suggérée et un score de confiance.
        Validez-la, modifiez-la, ou reprenez la main — dans tous les cas, elle progresse.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ type: 'spring', stiffness: 70, damping: 14 }}
        className="overflow-hidden rounded-2xl border-[1.5px]"
        style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)', background: 'var(--organic-bg)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
      >
        <div className="flex items-center gap-2.5 border-b-[1.5px] px-5 py-3.5" style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 8%, transparent)' }}>
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-terracotta-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sage-300)' }} />
          <span className="size-2.5 rounded-full" style={{ background: 'var(--organic-sand-300)' }} />
          <span className="ml-3 text-[13px] font-bold tracking-[.04em]">Raddlly · Inbox</span>
          <span className="tag ml-auto" style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-800)' }}>3 à traiter</span>
        </div>

        <div className="lp-inbox-grid grid min-h-[380px] grid-cols-[300px_minmax(0,1fr)]">
          {/* Left panel chat items */}
          <div className="border-r-[1.5px] p-3" style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 8%, transparent)' }}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="tag" style={{ background: 'var(--organic-terracotta-100)', color: 'var(--organic-terracotta-800)' }}>Tout · 47</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>Instagram</span>
              <span className="tag border" style={{ borderColor: 'var(--organic-terracotta)', color: 'var(--organic-terracotta-700)' }}>WhatsApp</span>
            </div>

            <div className="flex flex-col gap-2">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-xl p-3.5"
                style={{ background: 'var(--organic-terracotta-100)' }}
              >
                <div className="flex justify-between text-[13px]">
                  <strong>Maya R.</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>2m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Vous livrez au Canada ? Il me le faut avant…
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="rounded-xl p-3.5"
              >
                <div className="flex justify-between text-[13px]">
                  <strong>Jon B.</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>11m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Traité par l&apos;IA · statut de commande → résolu
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="rounded-xl p-3.5"
              >
                <div className="flex justify-between text-[13px]">
                  <strong>@petalandstem</strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>24m</span>
                </div>
                <div className="mt-[3px] text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                  Traité par l&apos;IA · lead capturé → CRM
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right panel chat message mockup */}
          <div className="flex flex-col gap-3 p-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.2 }}
              className="max-w-[70%] self-start rounded-[16px] rounded-bl-[4px] px-3.5 py-2.5 text-sm"
              style={{ background: 'var(--organic-sand-200)' }}
            >
              Vous livrez au Canada ? Il me le faut avant le 14 pour un mariage
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 85, damping: 14, delay: 0.38 }}
              className="mt-auto rounded-xl border-[1.5px] p-4"
              style={{ borderColor: 'var(--organic-terracotta-300)', background: 'var(--organic-terracotta-100)' }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-[.1em] uppercase" style={{ color: 'var(--organic-terracotta-700)' }}>
                  Réponse suggérée par l&apos;IA
                </span>
                <span className="tag" style={{ background: 'var(--organic-terracotta-200)', color: 'var(--organic-terracotta-800)' }}>94% de confiance</span>
              </div>
              <p className="mb-3 text-sm leading-[1.6]">
                Oui ! On livre au Canada en 3 à 5 jours ouvrés — commandez avant jeudi et ça arrivera bien avant le
                14. Je vous réserve un mot cadeau ?
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary">Valider &amp; envoyer</button>
                <button type="button" className="btn btn-ghost">Modifier</button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export function Testimonials() {
  const featured = TESTIMONIALS[0]
  const rest = TESTIMONIALS.slice(1)

  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Preuves & Avis" note="Agences · e-commerce · créateurs" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-8%' }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* Left Column: Featured Highlight Quote */}
        {featured && (
          <motion.div
            variants={cardVariants}
            className="lg:col-span-7 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden"
            style={{
              background: 'var(--organic-surface)',
              border: '1.5px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
              boxShadow: '0 8px 48px rgba(0,0,0,.07)',
            }}
          >
            {/* Top accent border */}
            <div
              className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, var(--organic-terracotta), var(--organic-sage))' }}
            />
            <div
              className="absolute top-4 right-6 font-mono text-7xl font-bold pointer-events-none select-none"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 6%, transparent)' }}
            >
              &ldquo;
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 text-amber-400">
                ★★★★★ <span className="font-mono text-xs font-bold ml-2" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>5.0 SCORE CLIENT</span>
              </div>
              <blockquote className="text-[clamp(17px,2vw,22px)] font-heading leading-relaxed font-medium" style={{ color: 'var(--organic-text)' }}>
                &ldquo;{featured.quote}&rdquo;
              </blockquote>
            </div>

            <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}>
              <span
                className="grid size-11 shrink-0 place-content-center rounded-full text-[14px] font-bold shadow-md"
                style={{ background: TONE_AVATAR_BG[featured.tone], color: TONE_AVATAR_FG[featured.tone] }}
              >
                {featured.initials}
              </span>
              <div>
                <strong className="block text-base font-bold" style={{ color: 'var(--organic-text)' }}>{featured.name}</strong>
                <span className="text-xs" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>{featured.role}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Right Column: Vertical Stream of Reviews */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {rest.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,.1)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="rounded-2xl p-6 flex flex-col justify-between cursor-default"
              style={{
                background: 'var(--organic-surface)',
                border: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)',
              }}
            >
              <div className="text-amber-400 text-xs mb-2">★★★★★</div>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'color-mix(in srgb, var(--organic-text) 82%, transparent)' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="grid size-8 shrink-0 place-content-center rounded-full text-[11px] font-bold"
                  style={{ background: TONE_AVATAR_BG[t.tone], color: TONE_AVATAR_FG[t.tone] }}
                >
                  {t.initials}
                </span>
                <div>
                  <strong className="block text-xs" style={{ color: 'var(--organic-text)' }}>{t.name}</strong>
                  <span className="text-[10px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export function ComparisonTable() {
  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Le changement" note="Migration gratuite sur tout plan payant" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 max-w-[24ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Les outils chatbot historiques datent de 2019.
      </motion.h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-8%' }}
        className="overflow-hidden rounded-3xl border-[1.5px]"
        style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
      >
        {/* Header Row */}
        <div
          className="grid border-b-[1.5px]"
          style={{
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr)',
            borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
            background: 'var(--organic-surface)',
          }}
        >
          <div className="px-6 py-4" />
          <div
            className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 border-l-[1.5px]"
            style={{
              borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
              background: 'color-mix(in srgb, var(--organic-terracotta) 7%, transparent)',
            }}
          >
            <span
              className="px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-[.12em] uppercase"
              style={{ background: 'var(--organic-terracotta)', color: '#fff' }}
            >
              ✦ Raddlly
            </span>
            <span className="text-[11px] font-bold" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>
              IA-native · 2025
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 border-l-[1.5px]"
            style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
          >
            <span className="text-[13px] font-bold" style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}>
              Outils historiques
            </span>
            <span className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 38%, transparent)' }}>
              ManyChat · Manychat Pro
            </span>
          </div>
        </div>

        {/* Data Rows */}
        {COMPARISON_ROWS.map(([label, us, them], rowIdx) => (
          <motion.div
            key={label}
            variants={cardVariants}
            className="grid border-b-[1px]"
            style={{
              gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr)',
              borderColor: 'color-mix(in srgb, var(--organic-text) 7%, transparent)',
            }}
          >
            {/* Label */}
            <div
              className="px-6 py-5 flex items-center"
              style={{ background: rowIdx % 2 === 0 ? 'var(--organic-bg)' : 'var(--organic-surface)' }}
            >
              <span className="text-[13.5px] font-semibold" style={{ color: 'var(--organic-text)' }}>{label}</span>
            </div>

            {/* Raddlly column */}
            <div
              className="px-4 py-5 flex items-start gap-2.5 border-l-[1.5px]"
              style={{
                borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
                background: rowIdx % 2 === 0
                  ? 'color-mix(in srgb, var(--organic-terracotta) 4%, var(--organic-bg))'
                  : 'color-mix(in srgb, var(--organic-terracotta) 4%, var(--organic-surface))',
              }}
            >
              <span
                className="shrink-0 mt-[2px] size-[18px] rounded-full flex items-center justify-center"
                style={{ background: 'var(--organic-terracotta)', color: '#fff' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--organic-text)' }}>{us}</span>
            </div>

            {/* Competitors column */}
            <div
              className="px-4 py-5 flex items-start gap-2.5 border-l-[1.5px]"
              style={{
                borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
                background: rowIdx % 2 === 0 ? 'var(--organic-bg)' : 'var(--organic-surface)',
              }}
            >
              <span
                className="shrink-0 mt-[2px] size-[18px] rounded-full flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--organic-text) 12%, transparent)' }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <span className="text-[12.5px] leading-relaxed" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>{them}</span>
            </div>
          </motion.div>
        ))}

        {/* Footer CTA Row */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr)',
            background: 'var(--organic-surface)',
          }}
        >
          <div className="px-6 py-5 flex items-center">
            <span className="text-[12px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}>
              Migration incluse en 2 jours ouvrés
            </span>
          </div>
          <div
            className="px-4 py-5 flex items-center justify-center border-l-[1.5px]"
            style={{
              borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
              background: 'color-mix(in srgb, var(--organic-terracotta) 7%, transparent)',
            }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-[12px] font-extrabold tracking-wide rounded-full px-4 py-2 shadow-md transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--organic-terracotta)', color: '#fff' }}
            >
              Démarrer gratuitement →
            </Link>
          </div>
          <div
            className="px-4 py-5 border-l-[1.5px]"
            style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
          />
        </div>
      </motion.div>
    </section>
  )
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleIndex = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="pb-[88px]">
      <SectionHeader kicker="Questions fréquentes" note="" />
      <div className="lp-faq-grid grid grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-x-[clamp(24px,5vw,80px)] gap-y-7">
        <h2 className="font-heading text-[clamp(28px,3.2vw,40px)] leading-[1.12]">Les questions qu&apos;on nous pose le plus.</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-8%" }}
          className="flex flex-col"
        >
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={item.q}
                variants={cardVariants}
                className="py-[18px]"
                style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? '1.5px solid color-mix(in srgb, var(--organic-text) 9%, transparent)' : undefined }}
              >
                <button
                  onClick={() => toggleIndex(i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-bold bg-transparent border-0 p-0 text-inherit hover:opacity-95 focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span style={{ fontFamily: 'var(--organic-body-family), system-ui, sans-serif' }}>{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex size-5 items-center justify-center text-lg font-normal shrink-0"
                    style={{ color: 'var(--organic-terracotta-700)' }}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.05 }
                        }
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 76%, transparent)' }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export function ClosingCta() {
  return (
    <section className="pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-5%" }}
        transition={{ type: 'spring', stiffness: 70, damping: 15 }}
        className="relative overflow-hidden rounded-3xl p-[clamp(40px,6vw,80px)_clamp(24px,5vw,72px)] border-[1.5px]"
        style={{
          background: 'var(--organic-surface)',
          borderColor: 'color-mix(in srgb, var(--organic-terracotta) 35%, transparent)',
          boxShadow: '0 8px 32px rgba(0,0,0,.08)',
        }}
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[.12em] uppercase" style={{ color: 'var(--organic-terracotta)' }}>
          ✦ Démarrer aujourd&apos;hui
        </span>
        <h2
          className="relative mt-5 max-w-[18ch] font-heading text-[clamp(32px,4.4vw,56px)] font-extrabold leading-[1.08]"
          style={{ color: 'var(--organic-text)' }}
        >
          Votre prochain client est en train d&apos;écrire, là, maintenant.
        </h2>
        <p className="relative mt-5 max-w-[52ch] text-[16.5px] leading-[1.65]" style={{ color: 'color-mix(in srgb, var(--organic-text) 78%, transparent)' }}>
          Un essai gratuit sur votre vrai compte, vos vrais DM. Si ça ne se rentabilise pas en un mois,
          on vous aide à repasser à votre ancien outil.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Link href="/register" className="btn btn-primary rounded-full px-6">
              Essai gratuit →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Link href="/register" className="btn btn-secondary rounded-full px-6">
              Commencer gratuitement
            </Link>
          </motion.div>
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Sans carte bancaire
          </span>
        </div>
      </motion.div>
    </section>
  )
}
