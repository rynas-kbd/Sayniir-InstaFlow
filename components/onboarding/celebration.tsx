'use client'

import { motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import { useEffect } from 'react'
import { haptic } from '@/lib/motion/haptics'
import { useT } from '@/components/i18n-provider'

/** Shown for a couple of seconds right after the first simulated reply lands — the "aha" payoff. */
export function Celebration() {
  const t = useT()

  useEffect(() => {
    haptic('success')
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center gap-3 rounded-xl border border-success/25 bg-success/8 px-6 py-8 text-center"
    >
      <motion.div
        initial={{ rotate: -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
        className="flex size-11 items-center justify-center rounded-full bg-success/15"
      >
        <PartyPopper className="size-5 text-success" />
      </motion.div>
      <div>
        <p className="text-[15px] font-bold text-foreground">{t('onboardingActivation.celebration.title')}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t('onboardingActivation.celebration.description')}
        </p>
      </div>
    </motion.div>
  )
}
