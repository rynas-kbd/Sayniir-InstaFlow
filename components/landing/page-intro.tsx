'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RaddllyIcon } from '@/components/raddlly-logo'

export function PageIntro() {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Smooth progress counter animation 0% -> 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 4
      })
    }, 40)

    const t1 = setTimeout(() => setPhase('reveal'), 1500)
    const t2 = setTimeout(() => {
      setPhase('done')
      setVisible(false)
    }, 2300)

    return () => {
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!visible) return null

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <div className="fixed inset-0 z-[99999] pointer-events-none flex flex-col justify-between overflow-hidden">
          {/* Top Half Curtain */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-[#090807] flex items-end justify-center pb-6"
            animate={phase === 'reveal' ? { y: '-100%' } : { y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Glossy seam highlight line */}
            <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--organic-terracotta)] to-transparent opacity-70" />
          </motion.div>

          {/* Bottom Half Curtain */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[#090807] flex items-start justify-center pt-6"
            animate={phase === 'reveal' ? { y: '100%' } : { y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />

          {/* Center Intro Content (Visible during loading phase) */}
          <motion.div
            className="relative z-10 my-auto flex flex-col items-center justify-center gap-4 px-6 text-center"
            animate={phase === 'reveal' ? { opacity: 0, scale: 0.92 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Ambient Backlight Glow */}
            <div
              className="absolute size-64 sm:size-80 rounded-full blur-3xl opacity-30 pointer-events-none -z-10 animate-pulse"
              style={{ background: 'radial-gradient(circle, #c8573c 0%, #e7b33d 70%, transparent 100%)' }}
            />

            {/* Brand Logo Mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl relative"
              style={{
                background: 'color-mix(in srgb, var(--organic-surface) 80%, transparent)',
                borderColor: 'color-mix(in srgb, var(--organic-text) 16%, transparent)',
              }}
            >
              <RaddllyIcon size={44} />
            </motion.div>

            {/* Brand Title */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading font-extrabold tracking-tight text-white text-[clamp(32px,5vw,54px)] leading-none"
            >
              Raddlly
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase text-zinc-300 max-w-[32ch]"
            >
              Vos DM vendent pendant que vous dormez
            </motion.p>

            {/* Progress Bar & Percentage Counter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col items-center gap-2 mt-4"
            >
              <div className="w-48 sm:w-64 h-[3px] rounded-full overflow-hidden bg-white/10 relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #c8573c, #e7b33d)',
                    boxShadow: '0 0 12px #c8573c',
                  }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                />
              </div>

              <span className="font-mono text-[11px] font-bold text-zinc-400">
                {progress}%
              </span>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
