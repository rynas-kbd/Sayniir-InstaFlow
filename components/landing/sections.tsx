"use client"

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
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
  const loop = [...LOGO_STRIP, ...LOGO_STRIP]
  return (
    <section className="pb-16 pt-8">
      <p
        className="mb-5 text-xs font-bold tracking-[.1em] uppercase text-center"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
      >
        Adopté par plus de 12 000 équipes qui vivent dans leurs DM
      </p>
      <div className="lp-marquee opacity-85 hover:opacity-100 transition-opacity">
        <div
          className="flex w-max items-center gap-[clamp(24px,4vw,56px)]"
          style={{ animation: 'marquee 36s linear infinite' }}
        >
          {loop.map((name, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="font-heading text-xl font-bold tracking-tight"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
            >
              {name}
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
          {loop.map((name, i) => (
            <span
              key={i}
              aria-hidden={i >= LOGO_STRIP.length}
              className="font-heading text-xl font-bold tracking-tight"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
            >
              {name}
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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Progress index for HUD indicator
  const [activeIdx, setActiveIdx] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(FEATURES.length - 1, Math.floor(v * FEATURES.length))
    setActiveIdx(idx)
  })

  // Cinematic gradient palette per feature
  const PALETTES = [
    { from: 'color-mix(in srgb, var(--organic-terracotta-200) 25%, transparent)', via: 'color-mix(in srgb, var(--organic-bg) 96%, transparent)', accent: 'var(--organic-terracotta)' },
    { from: 'color-mix(in srgb, var(--organic-sage-200) 22%, transparent)', via: 'color-mix(in srgb, var(--organic-bg) 96%, transparent)', accent: 'var(--organic-sage-600)' },
    { from: 'color-mix(in srgb, var(--organic-terracotta-300) 22%, transparent)', via: 'color-mix(in srgb, var(--organic-bg) 96%, transparent)', accent: 'var(--organic-terracotta)' },
    { from: 'color-mix(in srgb, var(--organic-sage-300) 20%, transparent)', via: 'color-mix(in srgb, var(--organic-bg) 96%, transparent)', accent: 'var(--organic-sage-600)' },
    { from: 'color-mix(in srgb, var(--organic-terracotta-200) 25%, transparent)', via: 'color-mix(in srgb, var(--organic-bg) 96%, transparent)', accent: 'var(--organic-terracotta)' },
    { from: 'color-mix(in srgb, var(--organic-sage-200) 25%, transparent)', via: 'color-mix(in srgb, var(--organic-sage-600) 10%, transparent)', accent: 'var(--organic-sage-600)' },
  ]

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-screen left-1/2 -translate-x-1/2"
      style={{ height: `${FEATURES.length * 100}vh` }}
    >
      {/* Sticky viewport right below Navbar */}
      <div className="sticky top-[54px] h-[calc(100vh-54px)] w-full overflow-hidden">
        
        {/* Right-hand Feature HUD indicator - strictly visible inside features viewport */}
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3 bg-[color-mix(in_srgb,var(--organic-bg)_80%,transparent)] p-3 rounded-2xl backdrop-blur-xl border border-[color-mix(in_srgb,var(--organic-text)_12%,transparent)] shadow-2xl">
          {FEATURES.map((f, i) => {
            const active = i === activeIdx
            return (
              <div
                key={i}
                className="group flex items-center gap-2.5 cursor-pointer"
              >
                <span
                  className="hidden md:inline-block text-[11px] font-mono font-bold transition-all duration-200"
                  style={{
                    color: active ? 'var(--organic-terracotta)' : 'color-mix(in srgb, var(--organic-text) 45%, transparent)',
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  0{i + 1}
                </span>
                <motion.div
                  animate={{
                    height: active ? 22 : 6,
                    width: active ? 6 : 6,
                    backgroundColor: active ? 'var(--organic-terracotta)' : 'color-mix(in srgb, var(--organic-text) 30%, transparent)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="rounded-full shadow-sm"
                />
              </div>
            )
          })}
        </div>

        {FEATURES.map((f, idx) => (
          <FeaturePanel
            key={f.title}
            feature={f}
            index={idx}
            total={FEATURES.length}
            scrollYProgress={scrollYProgress}
            palette={PALETTES[idx]}
          />
        ))}
      </div>
    </section>
  )
}

function FeaturePanel({
  feature,
  index,
  total,
  scrollYProgress,
  palette,
}: {
  feature: { title: string; body: string; tone: 'a' | 's' }
  index: number
  total: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
  palette: { from: string; via: string; accent: string }
}) {
  const enter = index / total
  const exit = (index + 1) / total
  const isFirst = index === 0

  // 1. Container Y, Opacity, and 3D Rotation (Dynamic high movement per feature)
  const y = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.03, exit]
      : [enter - 0.03, enter + 0.05, exit - 0.03, exit],
    isFirst
      ? ['0%', '0%', '-40%']
      : index === 1
      ? ['50%', '0%', '0%', '-45%']
      : index === 3
      ? ['70%', '0%', '0%', '-35%']
      : index === 5
      ? ['90%', '0%', '0%', '-60%']
      : ['60%', '0%', '0%', '-40%'],
  )

  const opacity = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.04, exit]
      : [enter - 0.02, enter + 0.04, exit - 0.04, exit],
    isFirst
      ? [1, 1, 0]
      : [0, 1, 1, 0],
  )

  const scale = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.04, exit]
      : [enter - 0.01, enter + 0.05, exit - 0.04, exit],
    isFirst
      ? [1, 1, 0.85]
      : index === 0
      ? [0.82, 1, 1, 0.85]
      : index === 4
      ? [0.85, 1, 1, 0.88]
      : [0.9, 1, 1, 0.85],
  )

  // 2. High-Movement Specific Transforms per Feature Index:
  // Index 0: 3D Pitch tilt (rotateX)
  // Index 1: Horizontal Split Sweep (Text X -120px, Card X +120px)
  // Index 2: 3D Door Flip (rotateY -45deg -> 0deg)
  // Index 3: Diagonal Slant (rotateZ -4deg -> 0deg)
  // Index 4: Vortex Twist (rotateZ 8deg -> 0deg)
  // Index 5: Elevator Rocket Launch (y +120px)

  const textX = useTransform(
    scrollYProgress,
    index === 1
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : index === 3
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [0, 1],
    index === 1
      ? [-120, 0, 0, -60]
      : index === 3
      ? [-80, 0, 0, -40]
      : [0, 0],
  )

  const cardX = useTransform(
    scrollYProgress,
    index === 1
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : index === 3
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [0, 1],
    index === 1
      ? [120, 0, 0, 60]
      : index === 3
      ? [80, 0, 0, 40]
      : [0, 0],
  )

  const cardRotateY = useTransform(
    scrollYProgress,
    index === 2
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : index === 1
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [0, 1],
    index === 2
      ? [-45, 0, 0, 20]
      : index === 1
      ? [-15, 0, 0, 15]
      : [0, 0],
  )

  const cardRotateZ = useTransform(
    scrollYProgress,
    index === 3
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : index === 4
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [0, 1],
    index === 3
      ? [-6, 0, 0, 6]
      : index === 4
      ? [8, 0, 0, -8]
      : [0, 0],
  )

  const rotateX = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.04, exit]
      : index === 0
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : index === 5
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [0, 1],
    isFirst
      ? [0, 0, -10]
      : index === 0
      ? [18, 0, 0, -10]
      : index === 5
      ? [-15, 0, 0, -10]
      : [0, 0],
  )

  const cardY = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.04, exit]
      : index === 5
      ? [enter - 0.02, enter + 0.05, exit - 0.04, exit]
      : [enter - 0.02, enter + 0.06, exit - 0.04, exit],
    isFirst
      ? [0, 0, -40]
      : index === 5
      ? [120, 0, 0, -40]
      : [70, 0, 0, -30],
  )

  const numY = useTransform(scrollYProgress, [enter, exit], [60, -120])
  const numOpacity = useTransform(
    scrollYProgress,
    isFirst
      ? [0, exit - 0.04, exit]
      : [enter, enter + 0.05, exit - 0.04, exit],
    isFirst
      ? [0.08, 0.08, 0]
      : [0, 0.08, 0.08, 0],
  )

  const numStr = `0${index + 1}`

  return (
    <motion.div
      style={{ y, opacity, scale, rotateX, perspective: 1200 }}
      className="absolute inset-0 flex items-center justify-center px-[clamp(24px,6vw,100px)] py-8"
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background: `radial-gradient(ellipse 75% 65% at 50% 50%, ${palette.from}, ${palette.via})`,
        }}
      />

      {/* Enormous Parallax Ghost Number */}
      <motion.span
        className="pointer-events-none absolute right-[6vw] top-1/2 font-heading font-extrabold select-none leading-none z-0"
        style={{
          fontSize: 'clamp(200px, 32vw, 420px)',
          color: 'var(--organic-text)',
          opacity: numOpacity,
          y: numY,
        }}
      >
        {numStr}
      </motion.span>

      {/* 2-Column Responsive Layout: Text Left + Interactive Graphic Card Right */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-[clamp(32px,5vw,72px)] w-full max-w-[1240px] mx-auto">
        {/* Left Column: Typography */}
        <motion.div style={{ x: textX }}>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-[.12em] uppercase shadow-sm"
            style={{
              background: `color-mix(in srgb, ${palette.accent} 12%, transparent)`,
              color: palette.accent,
              border: `1.5px solid color-mix(in srgb, ${palette.accent} 28%, transparent)`,
            }}
          >
            <span
              className="size-2 rounded-full animate-pulse"
              style={{ background: palette.accent }}
            />
            Pillier {numStr} / 06
          </div>

          <h2
            className="font-heading font-extrabold leading-[1.08] tracking-[-0.03em]"
            style={{
              fontSize: 'clamp(32px, 4.2vw, 56px)',
              color: 'var(--organic-text)',
            }}
          >
            {feature.title}
          </h2>

          <div
            className="my-6 h-[3px] w-20 rounded-full bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${palette.accent}, transparent)`,
            }}
          />

          <p
            className="max-w-[50ch] leading-[1.75]"
            style={{
              fontSize: 'clamp(15px, 1.4vw, 17.5px)',
              color: 'color-mix(in srgb, var(--organic-text) 76%, transparent)',
            }}
          >
            {feature.body}
          </p>
        </motion.div>

        {/* Right Column: Custom Interactive High-Tech Visual Card */}
        <motion.div
          className="relative rounded-3xl border-[1.5px] p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'color-mix(in srgb, var(--organic-bg) 85%, transparent)',
            borderColor: `color-mix(in srgb, ${palette.accent} 35%, transparent)`,
            boxShadow: `0 20px 50px color-mix(in srgb, ${palette.accent} 15%, transparent)`,
            y: cardY,
            x: cardX,
            rotateY: cardRotateY,
            rotateZ: cardRotateZ,
          }}
        >
          {/* Top shimmer accent */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
            }}
          />

          <FeatureGraphic index={index} accent={palette.accent} />
        </motion.div>
      </div>
    </motion.div>
  )
}

/** Render custom interactive visual mockups per feature */
function FeatureGraphic({ index, accent }: { index: number; accent: string }) {
  switch (index) {
    case 0:
      // Feature 1: AI Prompt Training & Persona Sync
      return (
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)] flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              IA Entraînée &amp; Active
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Synchro Web + FAQ
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--organic-sand-100)_60%,transparent)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)] mb-1">
              Directive de Ton
            </div>
            <p className="text-[13px] font-medium leading-relaxed text-[var(--organic-text)]">
              &quot;Réponds toujours de manière chaleureuse avec émoticônes botaniques, propose les promotions en cours et tutoie poliment.&quot;
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)] text-center">
              <div className="text-emerald-500 font-bold text-sm">100%</div>
              <div className="text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Respect de marque</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)] text-center">
              <div className="text-[var(--organic-terracotta)] font-bold text-sm">0 hallucination</div>
              <div className="text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Garantie prix</div>
            </div>
          </div>
        </div>
      )
    case 1:
      // Feature 2: Visual Drag-Drop Flow Engine
      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-2.5 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)] flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-500" />
              Studio No-Code Studio
            </span>
            <span className="text-[11px] font-mono text-blue-500 font-bold">5 Nœuds · Actif</span>
          </div>
          <div className="relative h-44 rounded-xl bg-[color-mix(in_srgb,var(--organic-bg)_95%,transparent)] border border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)] p-3 overflow-hidden flex items-center justify-around">
            <div className="p-2.5 rounded-lg bg-[var(--organic-bg)] border border-amber-500/40 shadow-sm text-center">
              <div className="font-bold text-[11px] text-[var(--organic-text)]">Mot-clé DM</div>
              <div className="text-[10px] text-amber-500">Trigger</div>
            </div>
            <div className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-blue-500 animate-pulse" />
            <div className="p-2.5 rounded-lg bg-[var(--organic-bg)] border border-blue-500/40 shadow-sm text-center">
              <div className="font-bold text-[11px] text-[var(--organic-text)]">IA Agent</div>
              <div className="text-[10px] text-blue-500">Qualification</div>
            </div>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" />
            <div className="p-2.5 rounded-lg bg-[var(--organic-bg)] border border-emerald-500/40 shadow-sm text-center">
              <div className="font-bold text-[11px] text-[var(--organic-text)]">Lien Panier</div>
              <div className="text-[10px] text-emerald-500">Conversion</div>
            </div>
          </div>
        </div>
      )
    case 2:
      // Feature 3: Auto Lead Qualification & CRM Sync
      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-2.5 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)]">Capture CRM Temps Réel</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600">Lead Chaud 🔥</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)] space-y-2">
            <div className="flex justify-between items-center text-[12px]">
              <span className="font-bold text-[var(--organic-text)]">Maya Lin</span>
              <span className="font-mono text-[11px] text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">@homefolk</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
              <span>📧 maya@homefolk.co</span>
              <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Vérifié</span>
            </div>
            <div className="text-[11px] text-[color-mix(in_srgb,var(--organic-text)_65%,transparent)]">
              Intention : <strong className="text-[var(--organic-text)]">Panier Céramique 44€</strong>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)] pt-1">
            <span>Synchro Shopify ✓</span>
            <span>Synchro Klaviyo ✓</span>
          </div>
        </div>
      )
    case 3:
      // Feature 4: High-Yield Re-engagement Campaigns
      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-2.5 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)]">Relance Panier Abandonné</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">Meta Conforme</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--organic-sand-100)_70%,transparent)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)]">
            <p className="text-[12.5px] leading-relaxed text-[var(--organic-text)]">
              &quot;Coucou Maya ! Vos mugs Terre Brute vous attendent toujours. Voici les -10% promis : CODE: DM10 🌿&quot;
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded-lg bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)]">
              <div className="font-bold text-emerald-500 text-sm">88%</div>
              <div className="text-[9px] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Ouverture</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)]">
              <div className="font-bold text-[var(--organic-terracotta)] text-sm">34%</div>
              <div className="text-[9px] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Clics</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--organic-bg)] border border-[color-mix(in_srgb,var(--organic-text)_8%,transparent)]">
              <div className="font-bold text-amber-500 text-sm">24h</div>
              <div className="text-[9px] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">Fenêtre</div>
            </div>
          </div>
        </div>
      )
    case 4:
      // Feature 5: Unified Team Inbox
      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-2.5 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)]">Inbox Partagée Unique</span>
            <span className="text-[11px] font-mono text-[var(--organic-terracotta)] font-bold">Relais Humain</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--organic-sand-100)_80%,transparent)] border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-amber-500" />
              <strong className="text-[11.5px] text-[var(--organic-text)]">Résumé IA avant transfert :</strong>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--organic-text)_75%,transparent)]">
              Prospect intéressé par commande sur mesure (&gt;500€). Demande validation de délai par un responsable.
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[color-mix(in_srgb,var(--organic-text)_60%,transparent)]">
            <span>Agent IA → Sarah (Manager)</span>
            <span className="font-bold text-emerald-600">Zero perte d&apos;info</span>
          </div>
        </div>
      )
    case 5:
    default:
      // Feature 6: Revenue Analytics
      return (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between border-b pb-2.5 border-[color-mix(in_srgb,var(--organic-text)_10%,transparent)]">
            <span className="font-bold text-[var(--organic-text)]">Impact sur le Chiffre d&apos;Affaires</span>
            <span className="text-[11px] font-mono font-bold text-emerald-600">+42 800€ ce mois</span>
          </div>
          <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
            {[35, 45, 60, 52, 78, 90, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background: i === 6 ? 'var(--organic-terracotta)' : 'color-mix(in srgb, var(--organic-terracotta) 35%, transparent)',
                  }}
                />
                <span className="text-[9px] font-mono text-[color-mix(in_srgb,var(--organic-text)_50%,transparent)]">J{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-[color-mix(in_srgb,var(--organic-text)_65%,transparent)] pt-1">
            <span>Conversion DM : <strong className="text-[var(--organic-text)]">38.4%</strong></span>
            <span>ROI IA : <strong className="text-emerald-600">14.2x</strong></span>
          </div>
        </div>
      )
  }
}



export function Channels() {
  const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    'DM Instagram': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
    WhatsApp: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
    Messenger: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  }

  return (
    <section className="pb-[88px]">
      <SectionHeader kicker="Canaux" note="API natives · pas de bricolage" />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 max-w-[22ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Là où vos clients sont déjà.
      </motion.h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-8%" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {CHANNEL_INFO.map((c) => (
          <motion.div
            key={c.title}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lp-card card flex-row items-start gap-4 p-6 cursor-pointer"
          >
            <span
              className="grid size-12 shrink-0 place-content-center rounded-xl"
              style={{ background: TONE_ICON_BG[c.tone], color: TONE_ICON_FG[c.tone] }}
            >
              {CHANNEL_ICONS[c.title] ?? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /></svg>
              )}
            </span>
            <div>
              <h3 className="mb-1.5 font-heading text-[17px]">{c.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.6]" style={{ color: 'color-mix(in srgb, var(--organic-text) 70%, transparent)' }}>
                {c.body}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
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
          <span className="ml-3 text-[13px] font-bold tracking-[.04em]">Instaflow · Inbox</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Featured Highlight Quote */}
        {featured && (
          <div
            className="lg:col-span-7 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
            style={{
              background: 'var(--organic-surface)',
              border: '1.5px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
            }}
          >
            <div
              className="absolute top-4 right-6 font-mono text-7xl font-bold pointer-events-none select-none"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 6%, transparent)' }}
            >
              “
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                ★★★★★ <span className="font-mono text-xs font-bold ml-2" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>5.0 SCORE CLIENT</span>
              </div>
              <blockquote className="text-[clamp(18px,2.2vw,24px)] font-heading leading-relaxed font-medium" style={{ color: 'var(--organic-text)' }}>
                "{featured.quote}"
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
          </div>
        )}

        {/* Right Column: Vertical Stream of Reviews */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {rest.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl p-6 flex flex-col justify-between"
              style={{
                background: 'var(--organic-surface)',
                border: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)',
              }}
            >
              <div className="text-amber-500 text-xs mb-2">★★★★★</div>
              <p className="text-xs leading-relaxed italic mb-4" style={{ color: 'color-mix(in srgb, var(--organic-text) 80%, transparent)' }}>
                "{t.quote}"
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
            </div>
          ))}
        </div>
      </div>
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
        className="mb-9 max-w-[24ch] font-heading text-[clamp(28px,3.2vw,42px)] leading-[1.12]"
      >
        Les outils chatbot historiques datent de 2019.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto rounded-2xl border-[1.5px]"
        style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
      >
        <table className="table" style={{ minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--organic-bg) 60%, transparent)' }}>
              <th style={{ width: '30%' }} />
              <th className="lp-col-us">Instaflow</th>
              <th className="lp-col-them">Outils historiques</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([label, us, them]) => (
              <tr key={label}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td>
                  <span className="lp-check inline-flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span className="text-[13.5px]" style={{ color: 'var(--organic-text)' }}>{us}</span>
                  </span>
                </td>
                <td>
                  <span className="lp-cross inline-flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    <span className="text-[13.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>{them}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
