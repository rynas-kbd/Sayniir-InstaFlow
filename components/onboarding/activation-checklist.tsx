'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConnectPanel } from '@/components/accounts/connect-panel'
import { CreateFlowForm } from '@/components/flows/create-flow-form'
import { ConversationSimulator } from '@/components/onboarding/conversation-simulator'
import { ONBOARDING_STEPS, type OnboardingStepId } from '@/lib/onboarding/steps'

interface ActivationChecklistProps {
  currentStepId: OnboardingStepId
  activeAccountId: string | null
  activePlatform: 'instagram' | 'whatsapp' | 'messenger' | null
  templateId: string
  /** 'sell_more' (boutique-only) also activates the ecommerce sales agent alongside the flow — see CreateFlowForm's enableSalesAgent prop. */
  primaryGoal: string | null
  whatsappAppId: string | null
  whatsappConfigId: string | null
}

const STEP_ORDER: OnboardingStepId[] = ONBOARDING_STEPS.map((s) => s.id)

export function ActivationChecklist({
  currentStepId,
  activeAccountId,
  activePlatform,
  templateId,
  primaryGoal,
  whatsappAppId,
  whatsappConfigId,
}: ActivationChecklistProps) {
  const router = useRouter()
  const [skipping, setSkipping] = useState(false)

  const currentIndex = STEP_ORDER.indexOf(currentStepId)

  async function handleSkip() {
    setSkipping(true)
    try {
      await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })
      router.refresh()
    } finally {
      setSkipping(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-base text-foreground">Mettons votre automatisation en route</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trois étapes, {currentIndex + 1}/{STEP_ORDER.length} — vous verrez une vraie réponse partir à la fin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipping}
              className="shrink-0 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Explorer par moi-même
            </button>
          </div>

          <div className="mb-5 flex gap-1.5">
            {STEP_ORDER.map((id, i) => (
              <div
                key={id}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < currentIndex ? 'bg-success' : i === currentIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {ONBOARDING_STEPS.map((step, i) => {
              const isDone = i < currentIndex
              const isCurrent = i === currentIndex
              const isLocked = i > currentIndex

              return (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    isCurrent ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/40 bg-muted/10'
                  )}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        isDone
                          ? 'bg-success text-white'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isDone ? <Check className="size-3" strokeWidth={3} /> : isLocked ? <Lock className="size-2.5" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[13px] font-semibold', isLocked ? 'text-muted-foreground' : 'text-foreground')}>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{step.description}</p>

                      <AnimatePresence>
                        {isCurrent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3.5 overflow-hidden"
                          >
                            {step.id === 'connect_channel' && (
                              <ConnectPanel whatsappAppId={whatsappAppId} whatsappConfigId={whatsappConfigId} />
                            )}
                            {step.id === 'create_automation' && activeAccountId && (
                              <CreateFlowForm
                                channelAccountId={activeAccountId}
                                defaultTemplateId={templateId}
                                activateOnCreate
                                enableSalesAgent={primaryGoal === 'sell_more'}
                                onCreated={() => router.refresh()}
                              />
                            )}
                            {step.id === 'test_it' && (
                              <ConversationSimulator platform={activePlatform} onActivated={() => router.refresh()} />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={skipping}
            className="mt-4 w-full text-xs text-muted-foreground"
          >
            Passer l&apos;introduction
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
