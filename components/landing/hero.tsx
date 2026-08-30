'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { CHANNELS } from '@/lib/landing-content'
import { useT } from '@/components/i18n-provider'

const ROTATE_INTERVAL_MS = 2800

function RotatingChannel({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ y: '40%', opacity: 0, filter: 'blur(4px)' }}
        animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: '-40%', opacity: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="inline-block whitespace-nowrap"
        style={{ color: 'var(--organic-terracotta)' }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  )
}

export function Hero() {
  const [channelIndex, setChannelIndex] = useState(0)
  const heroRef = useRef<HTMLElement>(null)
  const t = useT()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -32])

  // Get translated channels
  const channels = [
    t('landing.channels.instagram'),
    t('landing.channels.whatsapp'),
    t('landing.channels.messenger'),
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setChannelIndex((i) => (i + 1) % channels.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [channels.length])

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity, y: heroY, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      className="relative flex flex-col items-center justify-center text-center min-h-[calc(100vh-80px)] px-6 overflow-hidden my-4"
    >

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="font-heading text-[clamp(38px,3.6vw,58px)] font-extrabold leading-[1.12] tracking-[-0.025em] max-w-[90ch]"
        style={{ color: 'var(--organic-text)' }}
      >
        {t('landing.hero.heading')}{' '}
        <span className="relative inline-block overflow-hidden align-bottom h-[1.12em]">
          <RotatingChannel text={channels[channelIndex]} />
        </span>{' '}
        <span style={{ color: '#e7b33d', fontStyle: 'italic' }}>
          {t('landing.hero.headingSuffix')}
        </span>
      </motion.h1>

      {/* Subline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 max-w-[52ch] text-[16px] leading-[1.7]"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}
      >
        {t('landing.hero.subline')}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 flex items-center gap-4"
      >
        <Link
          href="/register"
          className="btn btn-primary h-[52px] px-9 text-[15px]"
        >
          {t('landing.hero.ctaPrimary')}
        </Link>
        <a
          href="#product"
          className="btn btn-secondary h-[52px] px-9 text-[15px]"
        >
          {t('landing.hero.ctaSecondary')}
        </a>
      </motion.div>

      {/* Minimal trust line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="mt-7 text-[12.5px]"
        style={{ color: 'color-mix(in srgb, var(--organic-text) 38%, transparent)' }}
      >
        {t('landing.hero.trustLine')}
      </motion.p>

      {/* Animated Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute bottom-4 flex flex-col items-center gap-2 cursor-pointer group"
        onClick={() => {
          document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })
        }}
      >
        <span
          className="text-[11.5px] font-semibold tracking-wide transition-colors group-hover:text-[var(--organic-terracotta)]"
          style={{ color: 'color-mix(in srgb, var(--organic-text) 52%, transparent)' }}
        >
          {t('landing.hero.scrollIndicator')}
        </span>
        <div
          className="w-5 h-8 rounded-full border-[1.5px] flex justify-center pt-1.5 transition-colors group-hover:border-[var(--organic-terracotta)]"
          style={{ borderColor: 'color-mix(in srgb, var(--organic-text) 25%, transparent)' }}
        >
          <motion.div
            className="w-1 h-2 rounded-full"
            style={{ background: 'var(--organic-terracotta)' }}
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </motion.section>
  )
}
