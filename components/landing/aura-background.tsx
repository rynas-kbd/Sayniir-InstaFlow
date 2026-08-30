'use client'

export function AuraBackground() {
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
          background:
            'radial-gradient(55.8% 55.49% at 50% 100%, rgb(20,60,120) 0%, rgba(10,30,80,0) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          inset: '-100px',
          background: `
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
        `,
          backgroundSize: '300% 200%',
          mixBlendMode: 'screen',
          filter: 'blur(108px)',
          opacity: 0.9,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 100% 100%, #ffffff 20%, #00030a 80%)',
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
          mixBlendMode: 'overlay',
          opacity: 0.85,
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
