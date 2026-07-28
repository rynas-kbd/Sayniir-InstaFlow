'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CHOICES: Array<{ value: string; label: string }> = [
  { value: 'connect_channel', label: 'Connecter mes canaux' },
  { value: 'automation_setup', label: 'Configurer mes automatisations' },
  { value: 'understanding_product', label: 'Comprendre comment tout fonctionne' },
]

/**
 * One question, shown once, in the [J+5, J+9] window (lib/onboarding/pulse.ts
 * decides eligibility server-side) — the guide's "short in-app feedback
 * channel at the end of week 1" to catch friction before it becomes churn.
 */
export function PulseSurvey() {
  const [visible, setVisible] = useState(true)
  const [answered, setAnswered] = useState(false)

  async function submit(answer: string | null, detail?: string) {
    setVisible(false)
    setAnswered(true)
    try {
      await fetch('/api/onboarding/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, detail }),
      })
    } catch {
      // Best-effort — worst case the survey resurfaces once more next load.
    }
  }

  if (answered) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <button
            type="button"
            onClick={() => submit(null)}
            aria-label="Ignorer"
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <p className="pr-6 text-[13px] font-semibold text-foreground">
            Qu&apos;est-ce qui vous a le plus bloqué cette semaine ?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHOICES.map((choice) => (
              <Button key={choice.value} variant="secondary" size="sm" onClick={() => submit(choice.value)} className="text-xs">
                {choice.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
