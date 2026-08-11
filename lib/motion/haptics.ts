'use client'

type HapticPattern = 'light' | 'medium' | 'success'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 30, 15],
}

/**
 * Thin wrapper around the Vibration API. Feature-detected and silently a
 * no-op where unsupported (desktop, iOS Safari) — haptics are a bonus
 * signal on top of the visual/audio feedback, never load-bearing.
 * Reserve calls for moments worth marking (a commit, a success) — calling
 * this on every interaction trains people to ignore it.
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(PATTERNS[pattern])
}
