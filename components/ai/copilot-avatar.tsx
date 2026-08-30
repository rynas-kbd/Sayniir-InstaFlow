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
  // getPropertyValue can return oklch/hsl strings — we only need the hex themes,
  // but oklch values won't work as `colors.body`. We normalise only hex strings.
  if (raw.startsWith('#') && raw.length >= 4) return raw
  // Fall back to the CSS `--primary` value, then brand terracotta.
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
    // Don't touch expression-level color overrides (e.g. angry-brows red)
  } as unknown as AvatarDefinition
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

interface CopilotAvatarProps {
  size?: number | string
  animation?: StrobishAnimation | string
  expression?: string
  className?: string
  ref?: React.Ref<AvatarController>
}

export function CopilotAvatar({
  size = 56,
  animation = 'idle',
  expression,
  className,
  ref,
}: CopilotAvatarProps) {
  const [bodyColor, setBodyColor] = useState<string>('#c67139')

  // Map 'talking' to 'working' if passed, since Strobi uses 'working' for active response state
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

  // Re-derive the definition whenever the color changes (cheap — just object spread)
  const definition = useMemo(
    () => applyBodyColor(strobi, bodyColor),
    [bodyColor]
  )

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Avatar
        ref={ref}
        definition={definition}
        {...(expression ? { expression } : { animation: effectiveAnimation })}
        size={size}
        ariaLabel="Strobi — assistant IA"
      />
    </div>
  )
}

