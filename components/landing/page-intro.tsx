'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_KEY = 'raddlly_intro_seen'

export function PageIntro() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading')

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    setVisible(true)

    const t1 = setTimeout(() => setPhase('reveal'), 1600)
    const t2 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 2400)
    const t3 = setTimeout(() => setVisible(false), 2700)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (!visible) return null

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <>
          {/* Top curtain */}
          <motion.div
            key="top"
            className="fixed inset-x-0 top-0 z-[9999] pointer-events-none"
            style={{ height: '50vh', background: '#0d0b09' }}
            animate={phase === 'reveal' ? { y: '-100%' } : { y: 0 }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            {phase === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="size-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c8573c 0%, #e7b33d 100%)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M4 7C4 5.34 5.34 4 7 4h14c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3h-5l-5 4v-4H7c-1.66 0-3-1.34-3-3V7z" fill="white" fillOpacity="0.95"/>
                  </svg>
                </motion.div>

                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="font-heading font-extrabold tracking-tight"
                  style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: '#f5f1ec' }}
                >
                  Raddlly
                </motion.span>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.55, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.28 }}
                  className="text-[13px] tracking-[0.14em] uppercase font-semibold"
                  style={{ color: '#f5f1ec' }}
                >
                  Vos DM vendent pendant que vous dormez
                </motion.p>

                <motion.div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[2px] rounded-full overflow-hidden"
                  style={{ width: 'min(240px, 40vw)', background: 'rgba(255,255,255,0.12)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #c8573c, #e7b33d)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Bottom curtain */}
          <motion.div
            key="bottom"
            className="fixed inset-x-0 bottom-0 z-[9999] pointer-events-none"
            style={{ height: '50vh', background: '#0d0b09' }}
            animate={phase === 'reveal' ? { y: '100%' } : { y: 0 }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          />

          {/* Seam */}
          <motion.div
            key="seam"
            className="fixed inset-x-0 z-[9998] pointer-events-none"
            style={{
              top: '50vh',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #c8573c 30%, #e7b33d 70%, transparent)',
            }}
            animate={phase === 'reveal' ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
