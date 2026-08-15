'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * SmoothScroll — initialise Lenis pour un défilement momentum premium.
 * - Lerp 0.1 = très fluide et naturel
 * - Synchronisé avec Framer Motion via le RAF natif
 * - Respecte prefers-reduced-motion (désactivé si activé)
 * - Nettoyage propre au unmount
 */
export function SmoothScroll() {
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      lerp: 0.1,          // 0 = instantané, 1 = ne bouge jamais. 0.1 = sweet spot
      smoothWheel: true,
      syncTouch: false,   // laisse le scroll natif sur mobile (plus naturel)
      duration: 1.2,
    })

    // Synchronise Lenis avec requestAnimationFrame
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const rafId = requestAnimationFrame(raf)

    // Expose lenis globally so anchor clicks (#section) are intercepted
    // Lenis handles anchor href automatically
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return null
}
