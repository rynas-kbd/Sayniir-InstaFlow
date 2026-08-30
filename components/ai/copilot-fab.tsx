'use client'

import { motion } from 'framer-motion'
import { springs } from '@/lib/motion/springs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'
import { CopilotAvatar } from './copilot-avatar'

interface CopilotFABProps {
  onClick: () => void
  /** When true, hides the FAB on mobile screens (e.g. flow builder where the
   * canvas already has its own "+" FAB at the bottom-right). The FAB remains
   * visible on desktop at all times. */
  hideOnMobile?: boolean
}

/**
 * The copilot's floating avatar (Grok-style).
 *
 * Three decorative layers:
 *   1. Outer breathing glow — colour driven by --organic-terracotta (= current theme)
 *   2. Glass ring — frosted halo sized just past the avatar
 *   3. The Strobi procedural avatar — no background fill, the avatar IS the button
 *
 * The avatar colour itself automatically follows the active colour theme because
 * CopilotAvatar reads --organic-terracotta-500 via a MutationObserver.
 */
export function CopilotFAB({ onClick, hideOnMobile = false }: CopilotFABProps) {
  const t = useT()

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'fixed z-40',
              hideOnMobile
                ? 'hidden md:flex md:bottom-6 md:end-6'
                : 'flex bottom-20 end-4 md:bottom-6 md:end-6'
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.snappy}
          >
            <motion.button
              type="button"
              onClick={onClick}
              aria-label={t('copilot.fab.ariaLabel')}
              className="group relative flex size-16 items-center justify-center rounded-full"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              transition={springs.snappy}
            >
              {/* Outer glow — breathes slowly, colour = current theme accent */}
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in srgb, var(--organic-terracotta) 45%, transparent) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.9, 1, 0.9] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Glass ring — frosted halo, same treatment as stat cards */}
              <span
                aria-hidden="true"
                className="glass-stat pointer-events-none absolute -inset-1.5 rounded-full transition-opacity duration-200 group-hover:opacity-70"
              />

              {/* Strobi — the avatar IS the button, no background fill */}
              <CopilotAvatar size={64} animation="idle" faceLeft={true} randomIdle={true} className="relative" />
            </motion.button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="hidden md:block" sideOffset={8}>
          <p className="text-sm">
            {t('copilot.fab.tooltipLabel')}{' '}
            <span className="text-muted-foreground">{t('copilot.fab.tooltipShortcut')}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
