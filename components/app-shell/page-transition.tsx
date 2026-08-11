'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as React from 'react'

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    // popLayout takes the exiting page out of flow immediately (position: absolute)
    // so the incoming page doesn't wait for it to finish — mode="wait" serialized
    // exit-then-enter here, paying ~440ms of dead time on every navigation.
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-1 flex-col min-h-full h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
