'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RaddllyIcon } from '@/components/raddlly-logo'
import { useT } from '@/components/i18n-provider'

export function PageIntro() {
  const [visible, setVisible] = useState(true)
  const t = useT()

  useEffect(() => {
    // Simple fade out après 1.5s
    const timer = setTimeout(() => {
      setVisible(false)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center bg-[#090807]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient Backlight Glow */}
          <div
            className="absolute size-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #c8573c 0%, #e7b33d 70%, transparent 100%)' }}
          />

          {/* Center Content */}
          <motion.div
            className="flex flex-col items-center justify-center gap-5 px-6 text-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Brand Logo Mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.7, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 
              }}
              className="p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(200, 87, 60, 0.08), rgba(231, 179, 61, 0.08))',
              }}
            >
              <RaddllyIcon size={48} />
              
              {/* Subtle pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-white/20"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.15, opacity: 0 }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </motion.div>

            {/* Brand Title */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.25, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="font-heading font-extrabold tracking-tight text-white text-[clamp(36px,5vw,56px)] leading-none"
            >
              Raddlly
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm font-medium tracking-wide text-zinc-400 max-w-[34ch]"
            >
              {t('landing.pageIntro.tagline')}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
