'use client'

import { useRef, ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: Direction
  distance?: number
  once?: boolean
  className?: string
  as?: keyof JSX.IntrinsicElements
}

const getInitial = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up':    return { opacity: 0, y:  distance }
    case 'down':  return { opacity: 0, y: -distance }
    case 'left':  return { opacity: 0, x:  distance }
    case 'right': return { opacity: 0, x: -distance }
    case 'none':  return { opacity: 0 }
  }
}

const getAnimate = (direction: Direction) => {
  switch (direction) {
    case 'up':
    case 'down': return { opacity: 1, y: 0 }
    case 'left':
    case 'right': return { opacity: 1, x: 0 }
    case 'none':  return { opacity: 1 }
  }
}

const getExit = (direction: Direction, distance: number) => {
  // When scrolling back up, animate back to a subtle downward position
  switch (direction) {
    case 'up':    return { opacity: 0, y: -distance * 0.5 }
    case 'down':  return { opacity: 0, y:  distance * 0.5 }
    case 'left':  return { opacity: 0, x: -distance * 0.5 }
    case 'right': return { opacity: 0, x:  distance * 0.5 }
    case 'none':  return { opacity: 0 }
  }
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.65,
  direction = 'up',
  distance = 32,
  once = false,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // once=false means it re-animates every time it enters/leaves viewport
  const inView = useInView(ref, { once, margin: '-80px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={getInitial(direction, distance)}
      animate={inView ? getAnimate(direction) : getInitial(direction, distance)}
      transition={{
        duration,
        delay: inView ? delay : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Stagger wrapper — wraps children and staggers their entrance */
interface StaggerProps {
  children: ReactNode
  stagger?: number
  delay?: number
  direction?: Direction
  distance?: number
  once?: boolean
  className?: string
}

export function StaggerReveal({
  children,
  stagger = 0.08,
  delay = 0,
  direction = 'up',
  distance = 24,
  once = false,
  className,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '-80px 0px' })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  const itemVariants = {
    hidden: getInitial(direction, distance),
    visible: {
      ...getAnimate(direction),
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Convenience child item for StaggerReveal */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
