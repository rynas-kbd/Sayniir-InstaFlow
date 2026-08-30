'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function AuraBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = !mounted || resolvedTheme === 'dark'
  const screenBlend = isDark ? 'screen' : 'multiply'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(55.8% 55.49% at 50% 100%, rgb(20,60,120) 0%, rgba(10,30,80,0) 100%)'
            : 'radial-gradient(55.8% 55.49% at 50% 100%, rgba(37,99,235,0.25) 0%, rgba(147,197,253,0) 100%)',
          mixBlendMode: screenBlend,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          inset: '-100px',
          background: isDark
            ? `
          repeating-linear-gradient(
            100deg,
            #041022 0%,
            #041022 3%,
            rgba(20, 60, 120, 0.7) 5%,
            rgba(20, 60, 120, 0.7) 7%,
            transparent 10%,
            transparent 12%,
            rgba(20, 60, 120, 0.7) 14%,
            #041022 16%
          ),
          repeating-linear-gradient(
            100deg,
            #b3e5ff 0%,
            #b3e5ff 1.5%,
            rgba(179, 229, 255, 0.8) 2%,
            #2563eb 3%,
            #2563eb 4%,
            rgba(179, 229, 255, 0.8) 4.5%,
            #b3e5ff 5%
          )
        `
            : `
          repeating-linear-gradient(
            100deg,
            #eff6ff 0%,
            #eff6ff 3%,
            rgba(59, 130, 246, 0.25) 5%,
            rgba(59, 130, 246, 0.25) 7%,
            transparent 10%,
            transparent 12%,
            rgba(59, 130, 246, 0.25) 14%,
            #eff6ff 16%
          ),
          repeating-linear-gradient(
            100deg,
            #dbeafe 0%,
            #dbeafe 1.5%,
            rgba(191, 219, 254, 0.6) 2%,
            #3b82f6 3%,
            #3b82f6 4%,
            rgba(191, 219, 254, 0.6) 4.5%,
            #dbeafe 5%
          )
        `,
          backgroundSize: '300% 200%',
          mixBlendMode: screenBlend,
          filter: 'blur(108px)',
          opacity: isDark ? 0.9 : 0.6,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse at 100% 100%, #ffffff 20%, #00030a 80%)'
            : 'radial-gradient(ellipse at 100% 100%, #e2e8f0 20%, #ffffff 80%)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: isDark ? 'overlay' : 'multiply',
          opacity: isDark ? 0.85 : 0.25,
          pointerEvents: 'none',
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0.181 0.608 0.061 0 0.075
                    0.181 0.608 0.061 0 0.075
                    0.181 0.608 0.061 0 0.075
                    0     0     0     1 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>
    </div>
  )
}
