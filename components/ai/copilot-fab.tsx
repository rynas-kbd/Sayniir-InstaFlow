'use client'

import { motion } from 'framer-motion'
import { BotMessageSquare } from 'lucide-react'
import { springs } from '@/lib/motion/springs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CopilotFABProps {
  onClick: () => void
}

/**
 * The copilot's floating orb. Three stacked layers give it depth instead of
 * a flat colored circle: an outer radial glow that breathes slowly (behind
 * everything, pointer-events-none), a glass ring (same `.glass-stat` treatment
 * used for stat cards elsewhere, sized just past the button), and the button
 * itself with an internal terracotta gradient instead of a flat fill.
 * The permanent icon-rotation of the previous version is gone — motion is
 * reserved for hover, so the orb doesn't compete for attention on every page.
 */
export function CopilotFAB({ onClick }: CopilotFABProps) {
  // MobileBottomNav (app/(app)/layout.tsx) renders on every mobile page, not
  // just the flow builder — bottom-20 clears its ~62px height (+ safe-area)
  // everywhere. The old bottom-6 default only avoided the nav on the one
  // route (/flows/[id]) that had been separately patched to bottom-20;
  // every other page still had the FAB sitting on top of the nav bar,
  // covering and swallowing taps on its rightmost "Plus" tab.
  const positionClasses = 'bottom-20 right-6 pb-safe'

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`fixed z-40 ${positionClasses}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.snappy}
          >
            <motion.button
              type="button"
              onClick={onClick}
              aria-label="Ouvrir le Copilote IA (Ctrl+I)"
              className="group relative flex size-14 items-center justify-center rounded-full"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={springs.snappy}
            >
              {/* Outer glow — a slow breathing radial gradient, well past the button's edge */}
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in srgb, var(--organic-terracotta) 55%, transparent) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.92, 1, 0.92] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Glass ring — same frosted treatment as the stat cards, sized past the button */}
              <span
                aria-hidden="true"
                className="glass-stat pointer-events-none absolute -inset-1.5 rounded-full transition-opacity duration-200 group-hover:opacity-80"
              />

              {/* The orb itself — gradient fill for volume instead of a flat color */}
              <span
                className="relative flex size-14 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-shadow duration-200 group-hover:shadow-xl"
                style={{
                  background: 'linear-gradient(145deg, var(--organic-terracotta-400) 0%, var(--organic-terracotta-600) 100%)',
                }}
              >
                <BotMessageSquare className="size-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                {/* Top-left highlight — a subtle glossy sheen, reads as depth rather than flat plastic */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(145deg, color-mix(in srgb, white 30%, transparent) 0%, transparent 45%)',
                  }}
                />
              </span>
            </motion.button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="hidden md:block" sideOffset={8}>
          <p className="text-sm">
            Copilote IA <span className="text-muted-foreground">(Ctrl+I)</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
