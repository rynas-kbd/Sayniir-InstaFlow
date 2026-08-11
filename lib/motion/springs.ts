import type { Transition } from 'framer-motion'

/**
 * Shared spring presets, replacing one-off `stiffness`/`damping` pairs
 * tuned by eye across the app. Values follow Apple's damping-ratio /
 * response model (Designing Fluid Interfaces, WWDC18): critically damped
 * (ratio 1.0, no overshoot) by default, with a touch of bounce (ratio 0.8)
 * reserved for elements a gesture actually threw — a released drag, a
 * flicked sheet. Converted to framer-motion's stiffness/damping via
 * stiffness = (2π / response)², damping = 2 · ratio · √stiffness.
 */
export const springs = {
  /** Default UI spring — toggles, active pills, popovers. No overshoot. */
  snappy: { type: 'spring', stiffness: 440, damping: 42 } satisfies Transition,

  /** Larger repositioning / layout moves. No overshoot, slightly slower settle. */
  smooth: { type: 'spring', stiffness: 250, damping: 32 } satisfies Transition,

  /** Only after a gesture carried momentum (drag release, flick, throw). */
  playful: { type: 'spring', stiffness: 440, damping: 34 } satisfies Transition,
} as const
