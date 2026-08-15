'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
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
  const heroRef = useRef<HTMLElement>(null)

  // Scroll-linked fade + scale out
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.96])
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -40])

  // Mouse coordinate trackers for 3D Parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring configuration for lag-free, butter-smooth movements
  const springConfig = { damping: 25, stiffness: 80, mass: 0.4 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Transform mouse positions into parallax translation values for different depth layers
  const orb1X = useTransform(smoothX, [-0.5, 0.5], [-25, 25])
  const orb1Y = useTransform(smoothY, [-0.5, 0.5], [-25, 25])

  const orb2X = useTransform(smoothX, [-0.5, 0.5], [20, -20])
  const orb2Y = useTransform(smoothY, [-0.5, 0.5], [20, -20])

  const card1X = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const card1Y = useTransform(smoothY, [-0.5, 0.5], [-12, 12])

  const card2X = useTransform(smoothX, [-0.5, 0.5], [16, -16])
  const card2Y = useTransform(smoothY, [-0.5, 0.5], [16, -16])

  const card3X = useTransform(smoothX, [-0.5, 0.5], [-18, 18])
  const card3Y = useTransform(smoothY, [-0.5, 0.5], [10, -10])

  const card4X = useTransform(smoothX, [-0.5, 0.5], [14, -14])
  const card4Y = useTransform(smoothY, [-0.5, 0.5], [-14, 14])

  useEffect(() => {
    const id = setInterval(() => {
      setChannelIndex((i) => (i + 1) % CHANNELS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  // Animation variants for staggered load entry
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
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

  return (
    <motion.section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center py-12 select-none"
    >
      {/* Background glowing gradient orbs with subtle parallax */}
      <motion.div
        className="pointer-events-none absolute -top-[160px] right-0 z-[-1] size-[420px] rounded-full"
        style={{
          x: orb1X,
          y: orb1Y,
          background: 'radial-gradient(closest-side, color-mix(in srgb, var(--organic-sage-300) 45%, transparent), transparent)',
          animation: 'floatSlow 14s ease-in-out infinite',
        }}
      />
      <motion.div
        className="pointer-events-none absolute top-10 -left-[140px] z-[-1] size-[320px] rounded-full"
        style={{
          x: orb2X,
          y: orb2Y,
          background: 'radial-gradient(closest-side, color-mix(in srgb, var(--organic-terracotta-200) 65%, transparent), transparent)',
          animation: 'floatSlow 18s ease-in-out -6s infinite',
        }}
      />

      <div className="lp-hero-grid grid grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] items-center gap-[clamp(24px,5vw,64px)]">
        {/* Left Side: Staggered Content Entry */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Real-time status pill */}
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 text-[12.5px] font-semibold shadow-xs"
            style={{
              borderColor: 'var(--organic-terracotta-300)',
              background: 'color-mix(in srgb, var(--organic-terracotta-100) 80%, transparent)',
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
          </motion.span>

          {/* Heading with rotating channel */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 font-heading text-[clamp(36px,4.5vw,62px)] font-extrabold leading-[1.12] tracking-tight"
            style={{ color: 'var(--organic-text)' }}
          >
            <span className="block">Vendez sur</span>
            <RotatingChannel text={CHANNELS[channelIndex]} />
            <span className="block">pendant que vous dormez.</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="mt-6 max-w-[48ch] text-[17.5px] leading-[1.65]" 
            style={{ color: 'color-mix(in srgb, var(--organic-text) 78%, transparent)' }}
          >
            Une IA formée sur votre marque répond à chaque message avec votre voix, qualifie l&apos;acheteur et classe
            le lead dans votre CRM — sur Instagram, WhatsApp et Messenger.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Link href="/register" className="btn btn-primary h-[46px] px-6 text-[14px]">
                Essai gratuit →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <a href="#product" className="btn btn-secondary h-[46px] px-6 text-[14px]">
                Voir la démo
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-7 flex items-center gap-3"
          >
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
          </motion.div>

          {/* Scroll down indicator */}
          <motion.div 
            variants={itemVariants}
            className="mt-10 flex items-start"
          >
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
          </motion.div>
        </motion.div>

        {/* Right side showcase: Interactive Parallax cards on Desktop, slide-up card on Mobile */}
        <div className="w-full">
          {/* Mobile Native Chat Card (shown only on mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.35 }}
            className="block md:hidden overflow-hidden rounded-3xl border-[1.5px] p-5 shadow-lg"
            style={{
              background: 'var(--organic-surface)',
              borderColor: 'color-mix(in srgb, var(--organic-text) 12%, transparent)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 10%, transparent)' }}>
              <div className="flex items-center gap-2.5">
                <span className="relative grid size-8 place-items-center rounded-full font-bold text-xs" style={{ background: 'var(--organic-terracotta-200)', color: 'var(--organic-terracotta-900)' }}>
                  M
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border border-white" />
                </span>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--organic-text)' }}>@maya · Instagram DM</div>
                  <div className="text-[10.5px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>En ligne · IA active</div>
                </div>
              </div>
              <span className="tag" style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-900)' }}>
                94% de confiance
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="max-w-[85%] self-start rounded-2xl rounded-bl-xs p-3 text-xs leading-[1.5]" style={{ background: 'var(--organic-bg)', color: 'var(--organic-text)' }}>
                Vous livrez au Canada avant le 14 ?
              </div>
              <div className="max-w-[88%] self-end rounded-2xl rounded-br-xs p-3 text-xs leading-[1.5]" style={{ background: 'var(--organic-terracotta-700)', color: '#fff' }}>
                <span className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wider text-amber-200">Instaflow IA · 1.9s</span>
                Oui — 3 à 5 jours, ça arrivera à temps. Je vous envoie le lien ?
              </div>
              <div className="flex items-center justify-between rounded-xl p-3 mt-1" style={{ background: 'var(--organic-sage-100)', color: 'var(--organic-sage-900)' }}>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Lead capturé → CRM
                </span>
                <span className="font-extrabold text-xs" style={{ color: 'var(--organic-terracotta-700)' }}>+38% conv.</span>
              </div>
            </div>
          </motion.div>

          {/* Desktop Floating Cards (shown only on md+) */}
          <div className="hidden md:block relative min-h-[440px] w-full">
            {/* Card 1: Question (@maya) */}
            <motion.div
              initial={{ opacity: 0, x: -40, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.2 }}
              style={{
                x: card1X,
                y: card1Y,
                position: 'absolute',
                left: 0,
                top: 2,
                width: '86%',
                zIndex: 10,
              }}
            >
              <div
                className="lp-float rounded-2xl rounded-bl-xs border-[1.5px] p-4 text-sm leading-[1.5]"
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
            </motion.div>

            {/* Card 2: Answer (Instaflow IA) */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.3 }}
              style={{
                x: card2X,
                y: card2Y,
                position: 'absolute',
                right: 0,
                top: 124,
                width: '88%',
                zIndex: 11,
              }}
            >
              <div
                className="lp-float rounded-2xl rounded-br-xs p-4 text-sm leading-[1.5]"
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
            </motion.div>

            {/* Card 3: HubSpot sync status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.45 }}
              style={{
                x: card3X,
                y: card3Y,
                position: 'absolute',
                left: '6%',
                top: 256,
                zIndex: 10,
              }}
            >
              <div
                className="lp-float inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] font-bold"
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
            </motion.div>

            {/* Card 4: Metrics box (+38%) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 75, damping: 14, delay: 0.55 }}
              style={{
                x: card4X,
                y: card4Y,
                position: 'absolute',
                right: '4%',
                top: 330,
                zIndex: 10,
              }}
            >
              <div
                className="lp-float rounded-2xl border-[1.5px] px-5 py-3.5"
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
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
