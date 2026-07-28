'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProgressIndicatorProps {
  step: string
  detail?: string
}

export function ProgressIndicator({ step, detail }: ProgressIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="flex items-start gap-3 rounded-2xl rounded-bl-[4px] border border-primary/25 bg-primary/10 px-4 py-3"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {/* Animated loader icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="mt-0.5 shrink-0"
        >
          <Loader2 className="size-4 text-primary" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {/* Main step message */}
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-sm font-medium text-foreground"
          >
            {step}
          </motion.p>

          {/* Optional detail message */}
          {detail && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-xs text-muted-foreground"
            >
              {detail}
            </motion.p>
          )}
        </div>

        {/* Subtle pulse animation on the container */}
        <motion.div
          className="absolute inset-0 rounded-2xl border border-primary/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ pointerEvents: 'none' }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

interface ThinkingIndicatorProps {
  message?: string
}

/**
 * Alternative compact indicator for when the AI is "thinking" (waiting for LLM response).
 * Displays a simpler, more subtle animation.
 */
export function ThinkingIndicator({ message = 'Réflexion en cours...' }: ThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Three animated dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-1.5 rounded-full bg-primary/60"
            animate={{
              y: [0, -4, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-xs">{message}</span>
    </motion.div>
  )
}
