'use client'

import { useCallback } from 'react'
import type { PanInfo } from 'framer-motion'
import { haptic } from './haptics'

interface UseDragDismissOptions {
  /** Called once the released gesture's projected endpoint crosses the dismiss threshold. */
  onDismiss: () => void
  /** Which axis the sheet travels on. Default 'y' (bottom/top sheets). */
  axis?: 'x' | 'y'
  /** Sign of the offset that counts as "toward dismiss": 1 = down/right, -1 = up/left. Default 1 (bottom sheet). */
  direction?: 1 | -1
  /** Drag distance (px) past which dismiss commits even at low velocity. */
  distanceThreshold?: number
  /** Release velocity (px/s) past which dismiss commits regardless of distance. */
  velocityThreshold?: number
}

/**
 * Vertical swipe-to-dismiss for a sheet/drawer, spread onto a framer-motion
 * `motion.div` (`drag="y"` already gives 1:1 pointer tracking, pointer
 * capture, and an interruptible spring for free). What framer-motion doesn't
 * decide on its own is *whether a release should dismiss* — this projects
 * the gesture's momentum forward (Apple's exponential-decay scroll formula)
 * instead of judging the raw release position, so a fast short flick
 * dismisses and a slow long drag that stalls doesn't.
 */
export function useDragDismiss({
  onDismiss,
  axis = 'y',
  direction = 1,
  distanceThreshold = 80,
  velocityThreshold = 500,
}: UseDragDismissOptions) {
  const handleDragEnd = useCallback(
    (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      const offset = axis === 'y' ? info.offset.y : info.offset.x
      const velocity = axis === 'y' ? info.velocity.y : info.velocity.x
      const signedOffset = offset * direction
      const signedVelocity = velocity * direction
      const projectedEndpoint = signedOffset + projectMomentum(signedVelocity)
      const shouldDismiss =
        projectedEndpoint > distanceThreshold || signedVelocity > velocityThreshold
      if (shouldDismiss) {
        haptic('light')
        onDismiss()
      }
    },
    [onDismiss, axis, direction, distanceThreshold, velocityThreshold]
  )

  // Apple's rubber-band constant (0.55): resists pulling past the rest
  // position instead of hard-stopping, more so toward dismiss than away
  // from it so the sheet doesn't feel like it can float off-screen.
  const nearElastic = 0.08
  const farElastic = 0.55
  const dragConstraints =
    axis === 'y' ? { top: 0, bottom: 0 } : { left: 0, right: 0 }
  const dragElastic =
    axis === 'y'
      ? direction === 1
        ? { top: nearElastic, bottom: farElastic }
        : { top: farElastic, bottom: nearElastic }
      : direction === 1
        ? { left: nearElastic, right: farElastic }
        : { left: farElastic, right: nearElastic }

  return {
    drag: axis,
    dragConstraints,
    dragElastic,
    onDragEnd: handleDragEnd,
  }
}

/** Where a flick's momentum would carry it — same decay curve as native scroll deceleration. */
function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}
