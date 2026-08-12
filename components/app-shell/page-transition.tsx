'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as React from 'react'

export function PageTransitionWrapper({
  children,
  accountKey,
}: {
  children: React.ReactNode
  /**
   * Active account id (or 'all'/'none') — folded into the remount key below
   * so switching accounts forces every page's client subtree to remount
   * with fresh props instead of keeping whatever it seeded into useState()
   * on first mount. See lib/accounts/actions.ts::setActiveAccount and
   * components/app-shell/account-switcher.tsx — this is the single point
   * of leverage that avoids touching every account-scoped client component
   * individually.
   */
  accountKey?: string
}) {
  const pathname = usePathname()

  return (
    // popLayout takes the exiting page out of flow immediately (position: absolute)
    // so the incoming page doesn't wait for it to finish — mode="wait" serialized
    // exit-then-enter here, paying ~440ms of dead time on every navigation.
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={`${pathname}::${accountKey ?? 'none'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-1 flex-col min-h-full w-full pb-32 md:pb-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
