'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'

function getChoices(t: Translator): Array<{ value: string; label: string }> {
  return [
    { value: 'connect_channel', label: t('onboardingActivation.pulseSurvey.choices.connectChannel') },
    { value: 'automation_setup', label: t('onboardingActivation.pulseSurvey.choices.automationSetup') },
    { value: 'understanding_product', label: t('onboardingActivation.pulseSurvey.choices.understandingProduct') },
  ]
}

/**
 * One question, shown once, in the [J+5, J+9] window (lib/onboarding/pulse.ts
 * decides eligibility server-side) — the guide's "short in-app feedback
 * channel at the end of week 1" to catch friction before it becomes churn.
 */
export function PulseSurvey() {
  const t = useT()
  const [visible, setVisible] = useState(true)
  const [answered, setAnswered] = useState(false)
  const choices = getChoices(t)

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
            aria-label={t('onboardingActivation.pulseSurvey.dismissAriaLabel')}
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <p className="pr-6 text-[13px] font-semibold text-foreground">
            {t('onboardingActivation.pulseSurvey.question')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {choices.map((choice) => (
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
