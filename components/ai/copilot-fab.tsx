'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CopilotFABProps {
  onClick: () => void
}

export function CopilotFAB({ onClick }: CopilotFABProps) {
  const pathname = usePathname()

  // Ajuster la position si on est sur le flow builder pour éviter le conflit avec le FAB existant
  const isFlowBuilder = pathname?.match(/^\/flows\/[^/]+$/)
  
  // Classes de position adaptatives
  const positionClasses = isFlowBuilder
    ? 'bottom-20 right-6' // Décalé vers le haut pour éviter le FAB du flow canvas
    : 'bottom-6 right-6 pb-safe' // Position normale avec safe-area pour iOS

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`fixed z-40 ${positionClasses}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
          >
            {/* Animation de pulse sur le container */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(198, 113, 57, 0.4)',
                  '0 0 0 10px rgba(198, 113, 57, 0)',
                  '0 0 0 0 rgba(198, 113, 57, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              className="rounded-full"
            >
              <Button
                size="icon"
                onClick={onClick}
                className="size-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-xl active:scale-95"
                aria-label="Ouvrir le Copilote IA (Ctrl+I)"
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut',
                  }}
                >
                  <Sparkles className="size-6" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="hidden md:block"
          sideOffset={8}
        >
          <p className="text-sm">
            Copilote IA <span className="text-muted-foreground">(Ctrl+I)</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
