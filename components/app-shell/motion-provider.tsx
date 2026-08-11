'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Wires the OS-level "reduce motion" preference into every framer-motion
 * animation in the app tree at once — individual components don't each
 * need their own useReducedMotion() check.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
