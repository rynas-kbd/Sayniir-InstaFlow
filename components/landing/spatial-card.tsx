'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface SpatialCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  depth?: number
  tiltIntensity?: number
  glareOpacity?: number
  borderGlow?: boolean
  onClick?: () => void
}

export function SpatialCard({
  children,
  className = '',
  style = {},
  depth = 25,
  tiltIntensity = 14,
  glareOpacity = 0.25,
  borderGlow = true,
  onClick,
}: SpatialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Mouse positions normalized [-0.5, 0.5]
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for rotation
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 }
  const mouseXSpring = useSpring(x, springConfig)
  const mouseYSpring = useSpring(y, springConfig)

  // Map mouse positions to 3D rotation angles
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltIntensity, -tiltIntensity])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltIntensity, tiltIntensity])

  // Specular light position (% values for linear-gradient)
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className="relative inline-block w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          ...style,
        }}
        animate={{
          scale: isHovered ? 1.02 : 1,
          translateZ: isHovered ? depth : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className={`relative overflow-hidden rounded-2xl border transition-colors duration-300 ${className}`}
      >
        {/* Children content wrapper with z-axis depth offset */}
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
          {children}
        </div>

        {/* Specular Light Reflection Glare Overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: isHovered ? glareOpacity : 0,
            background: `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.4) 0%, rgba(200,90,50,0.15) 30%, transparent 70%)`,
          }}
        />

        {/* Dynamic Chromatic Border Glow */}
        {borderGlow && (
          <motion.div
            className="pointer-events-none absolute -inset-[1px] z-10 rounded-2xl border transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0.3,
              borderColor: isHovered ? 'var(--organic-terracotta)' : 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
              boxShadow: isHovered
                ? '0 12px 35px -8px color-mix(in srgb, var(--organic-terracotta) 30%, transparent), 0 0 20px 2px color-mix(in srgb, var(--organic-terracotta) 20%, transparent)'
                : '0 4px 12px rgba(0,0,0,0.05)',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
