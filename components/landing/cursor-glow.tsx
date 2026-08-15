'use client'

import { useEffect, useRef } from 'react'

/**
 * A radial gradient spotlight that smoothly follows the cursor.
 * Completely invisible on touch/mobile devices.
 * Respects `prefers-reduced-motion`.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const posRef = useRef({ x: -999, y: -999 })
  const smoothRef = useRef({ x: -999, y: -999 })

  useEffect(() => {
    // Don't show on touch-primary devices
    if (window.matchMedia('(hover: none)').matches) return
    // Respect reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const handleMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMove, { passive: true })

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      smoothRef.current.x = lerp(smoothRef.current.x, posRef.current.x, 0.09)
      smoothRef.current.y = lerp(smoothRef.current.y, posRef.current.y, 0.09)
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${smoothRef.current.x - 300}px, ${smoothRef.current.y - 300}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{ mixBlendMode: 'normal' }}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--organic-terracotta) 7%, transparent), transparent)',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
