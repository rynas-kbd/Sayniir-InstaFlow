'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar } from '@bible-strong/avatar-react'
import type { AvatarController } from '@bible-strong/avatar-react'
import type { AvatarDefinition } from '@bible-strong/avatar-core'
import strobi from './strobi.avatar.json'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Read the current --organic-terracotta-500 (or primary color) from :root */
function readThemeColor(): string {
  if (typeof window === 'undefined') return '#c67139'
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--organic-terracotta-500')
    .trim()
  if (raw.startsWith('#') && raw.length >= 4) return raw

  const primary = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim()
  if (primary.startsWith('#') && primary.length >= 4) return primary
  return '#c67139'
}

/** Overlay the body color on every expression that doesn't have its own color override */
function applyBodyColor(def: typeof strobi, color: string): AvatarDefinition {
  return {
    ...def,
    colors: { ...def.colors, body: color },
  } as unknown as AvatarDefinition
}

// Organic idle expressions that make Strobi look alive and inquisitive
const IDLE_EXPRESSIONS = [
  'neutral',
  'curious-left',
  'attentive-left',
  'upward-side-glance',
  'playful-right',
  'skeptical-left',
  'gentle-downward-gaze',
  'surprised-left',
  'small-attentive',
]

// ─── sentiment & reaction helper ───────────────────────────────────────────

/**
 * Analyzes text (user prompt or bot reply) and returns a suitable Strobi reaction
 * (either an expression or a Strobish animation).
 */
export function getReactionForText(text: string): { animation?: string; expression?: string } {
  if (!text) return { animation: 'idle' }

  const lower = text.toLowerCase().trim()

  // 1. Greetings & Positive feedback
  if (
    /\b(salut|bonjour|hello|hi|coucou|merci|bravo|super|cool|top|génial|parfait|love|bien|thanks|superbe|excellente?)\b/.test(
      lower
    )
  ) {
    return { expression: 'joyful-wide' }
  }

  // 2. Questions & Curiosity
  if (
    /\?/.test(lower) ||
    /\b(quoi|pourquoi|comment|où|qui|quand|est-ce|pourrais-tu|peux-tu|expliqu?e|aide|montre|search|cherche)\b/.test(
      lower
    )
  ) {
    return { animation: 'searching', expression: 'curious-left' }
  }

  // 3. Doubt, Errors, Bugs
  if (
    /\b(bizarre|erreur|bug|problème|non|faux|pas|impossible|échec|fail|cassé|invalide)\b/.test(
      lower
    )
  ) {
    return { expression: 'skeptical-left' }
  }

  // 4. Strong negative / Anger
  if (
    /\b(stop|merde|putain|chiant|grave|détruire|supprime|nul|mauvais|inutile)\b/.test(
      lower
    )
  ) {
    return { expression: 'angry-brows' }
  }

  // 5. Technical / Building / Thinking tasks
  if (
    /\b(analyser|créer|générer|code|développer|flow|automation|calculer|construire|script|pipeline)\b/.test(
      lower
    )
  ) {
    return { animation: 'thinking' }
  }

  return { animation: 'idle' }
}

// ─── component ──────────────────────────────────────────────────────────────

export type StrobishAnimation =
  | 'idle'
  | 'sleeping'
  | 'waking'
  | 'listening'
  | 'thinking'
  | 'searching'
  | 'working'
  | 'talking'

export interface CopilotAvatarProps {
  size?: number | string
  animation?: StrobishAnimation | string
  expression?: string
  /** Turn the avatar left (towards the screen/chat content) — default: true */
  faceLeft?: boolean
  /** Enable random expression shifting while in idle state — default: true */
  randomIdle?: boolean
  className?: string
  ref?: React.Ref<AvatarController>
}

export function CopilotAvatar({
  size = 56,
  animation = 'idle',
  expression,
  faceLeft = true,
  randomIdle = true,
  className,
  ref,
}: CopilotAvatarProps) {
  const [bodyColor, setBodyColor] = useState<string>('#c67139')
  const [currentIdleExpr, setCurrentIdleExpr] = useState<string | null>(null)

  // Map 'talking' to 'working' if passed
  const effectiveAnimation = animation === 'talking' ? 'working' : animation

  // Read initial theme color once mounted
  useEffect(() => {
    setBodyColor(readThemeColor())
  }, [])

  // Watch for theme changes (data-color-theme attribute + class changes on <html>)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setBodyColor(readThemeColor())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-theme', 'class', 'style'],
    })
    return () => observer.disconnect()
  }, [])

  // Periodically cycle through random expressions when idle
  useEffect(() => {
    if (!randomIdle || animation !== 'idle' || expression) {
      setCurrentIdleExpr(null)
      return
    }

    let timeoutId: NodeJS.Timeout

    const scheduleNextShift = () => {
      // Random delay between 4.5s and 8.5s
      const delay = Math.floor(Math.random() * 4000) + 4500
      timeoutId = setTimeout(() => {
        const nextExpr =
          IDLE_EXPRESSIONS[Math.floor(Math.random() * IDLE_EXPRESSIONS.length)]
        setCurrentIdleExpr(nextExpr)
        scheduleNextShift()
      }, delay)
    }

    scheduleNextShift()

    return () => clearTimeout(timeoutId)
  }, [randomIdle, animation, expression])

  // Re-derive the definition whenever the color changes
  const definition = useMemo(
    () => applyBodyColor(strobi, bodyColor),
    [bodyColor]
  )

  const activeExpression = expression || currentIdleExpr || undefined

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        transform: faceLeft ? 'scaleX(-1)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <Avatar
        ref={ref}
        definition={definition}
        {...(activeExpression
          ? { expression: activeExpression }
          : { animation: effectiveAnimation })}
        size={size}
        ariaLabel="Strobi — assistant IA"
      />
    </div>
  )
}
