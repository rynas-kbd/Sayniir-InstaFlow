'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { COLOR_THEMES, useCustomTheme, type ColorTheme } from '@/components/custom-theme-provider'
import { LanguagePicker } from '@/components/settings/language-picker'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'
import { springs } from '@/lib/motion/springs'
import {
  ShoppingBag,
  CalendarClock,
  Target,
  Sparkles,
  MessageSquareText,
  HelpCircle,
  MousePointerClick,
  Bot,
  TrendingUp,
  User,
  Users,
  UsersRound,
  Building2,
  ArrowLeft,
  Check,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/components/auth/auth-card'

type BusinessType = 'ecommerce' | 'coaching' | 'agency' | 'generic'
type PrimaryGoal = 'reply_faster' | 'automate_faq' | 'convert_comments' | 'qualify_leads' | 'sell_more'
type TeamSize = 'solo' | '2-5' | '6-20' | '20+'

function getBusinessTypes(t: Translator): Array<{ value: BusinessType; label: string; icon: typeof ShoppingBag }> {
  return [
    { value: 'ecommerce', label: t('onboarding.businessTypes.ecommerce'), icon: ShoppingBag },
    { value: 'coaching', label: t('onboarding.businessTypes.coaching'), icon: CalendarClock },
    { value: 'agency', label: t('onboarding.businessTypes.agency'), icon: Target },
    { value: 'generic', label: t('onboarding.businessTypes.generic'), icon: Sparkles },
  ]
}

// Mirrors GOAL_TO_TEMPLATE_ID in lib/onboarding/steps.ts — keep the value set in sync.
function getPrimaryGoals(t: Translator): Array<{ value: PrimaryGoal; label: string; icon: typeof MessageSquareText }> {
  return [
    { value: 'reply_faster', label: t('onboarding.goals.replyFaster'), icon: MessageSquareText },
    { value: 'automate_faq', label: t('onboarding.goals.automateFaq'), icon: HelpCircle },
    { value: 'convert_comments', label: t('onboarding.goals.convertComments'), icon: MousePointerClick },
    { value: 'qualify_leads', label: t('onboarding.goals.qualifyLeads'), icon: Bot },
  ]
}

// Boutique-only — only makes sense once business_type = 'ecommerce', shown
// conditionally below. Activates the ecommerce sales agent directly (see
// activation-checklist.tsx), not just a flow like the other goals.
function getSellMoreGoal(t: Translator): { value: PrimaryGoal; label: string; icon: typeof TrendingUp } {
  return { value: 'sell_more', label: t('onboarding.goals.sellMore'), icon: TrendingUp }
}

function getTeamSizes(t: Translator): Array<{ value: TeamSize; label: string; icon: typeof User }> {
  return [
    { value: 'solo', label: t('onboarding.teamSizes.solo'), icon: User },
    { value: '2-5', label: t('onboarding.teamSizes.small'), icon: Users },
    { value: '6-20', label: t('onboarding.teamSizes.medium'), icon: UsersRound },
    { value: '20+', label: t('onboarding.teamSizes.large'), icon: Building2 },
  ]
}

const AUTO_ADVANCE_DELAY_MS = 320

/** Premium selection card — gradient icon chip, selected ring + glow + check badge, hover lift. */
function OptionTile<T extends string>({
  value,
  label,
  icon: Icon,
  selected,
  onSelect,
}: {
  value: T
  label: string
  icon: typeof ShoppingBag
  selected: boolean
  onSelect: (value: T) => void
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      className={cn(
        'relative flex flex-col items-center gap-2.5 rounded-2xl border px-4 py-5 text-center transition-colors duration-200',
        selected
          ? 'border-primary bg-primary/6 shadow-[0_4px_20px_-4px] shadow-primary/25'
          : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
      )}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.snappy}
          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        >
          <Check className="size-3" strokeWidth={3} />
        </motion.span>
      )}
      <span
        className="flex size-10 items-center justify-center rounded-full"
        style={
          selected
            ? { background: 'linear-gradient(145deg, var(--organic-terracotta-400) 0%, var(--organic-terracotta-600) 100%)' }
            : undefined
        }
      >
        <Icon className={cn('size-5', selected ? 'text-primary-foreground' : 'text-muted-foreground')} strokeWidth={1.75} />
      </span>
      <span className={cn('text-[12.5px] font-semibold leading-tight', selected ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </motion.button>
  )
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-1 flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < step ? 'bg-success' : i === step ? 'bg-primary' : 'bg-muted')}
        />
      ))}
    </div>
  )
}

export function WelcomeForm() {
  const router = useRouter()
  const t = useT()
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useCustomTheme()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null)
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
  }, [])

  const primaryGoals = getPrimaryGoals(t)
  const sellMoreGoal = getSellMoreGoal(t)

  // Filtrer les objectifs selon le type de business sélectionné
  const getGoalsForBusinessType = (type: BusinessType | null): typeof primaryGoals => {
    if (!type) return primaryGoals

    switch (type) {
      case 'ecommerce':
        // E-commerce : tous les objectifs + vendre plus
        return [...primaryGoals, sellMoreGoal]
      case 'coaching':
        // Coaching : réponse rapide, FAQ, qualifier
        return primaryGoals.filter(g => ['reply_faster', 'automate_faq', 'qualify_leads'].includes(g.value))
      case 'agency':
        // Agence : réponse rapide, convertir commentaires, qualifier leads
        return primaryGoals.filter(g => ['reply_faster', 'convert_comments', 'qualify_leads'].includes(g.value))
      case 'generic':
        // Autre : tous sauf vendre plus
        return primaryGoals
      default:
        return primaryGoals
    }
  }

  const visibleGoals = getGoalsForBusinessType(businessType)
  const canFinish = businessType !== null && teamSize !== null

  function goTo(nextStep: number, dir: 1 | -1) {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    setDirection(dir)
    setStep(nextStep)
  }

  function autoAdvance(nextStep: number) {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    advanceTimeout.current = setTimeout(() => goTo(nextStep, 1), AUTO_ADVANCE_DELAY_MS)
  }

  function handleBusinessTypeSelect(value: BusinessType) {
    setBusinessType(value)
    // Réinitialiser l'objectif si le nouveau type de business ne le supporte plus
    const goalsForType = getGoalsForBusinessType(value)
    if (primaryGoal && !goalsForType.some(g => g.value === primaryGoal)) {
      setPrimaryGoal(null)
    }
    autoAdvance(1)
  }

  function handleGoalSelect(value: PrimaryGoal) {
    setPrimaryGoal(value)
    autoAdvance(2)
  }

  function handleTeamSizeSelect(value: TeamSize) {
    setTeamSize(value)
    autoAdvance(3)
  }

  async function handleSubmit() {
    if (!canFinish) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: businessType,
          primary_goal: primaryGoal,
          team_size: teamSize,
          theme_mode: theme,
          color_theme: colorTheme,
        }),
      })
      if (!res.ok) throw new Error()
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError(t('onboarding.error'))
      setSaving(false)
    }
  }

  async function handleSkip() {
    setSaving(true)
    try {
      await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })
    } finally {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const stepTitles = [
    t('onboarding.stepTitles.businessType'),
    t('onboarding.stepTitles.goal'),
    t('onboarding.stepTitles.teamSize'),
    t('onboarding.stepTitles.personalize'),
  ]

  return (
    <AuthCard tagline={t('onboarding.tagline')}>
      <div className="flex flex-col gap-5">
        <div>
          <ProgressBar step={step} total={4} />
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goTo(step - 1, -1)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3" /> {t('onboarding.back')}
              </button>
            ) : (
              <span />
            )}
            <span className="text-[11px] font-medium text-muted-foreground">
              {t('onboarding.stepCounter', { current: step + 1, total: 4 })}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 28 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3.5 text-center text-[14px] font-semibold text-foreground">{stepTitles[step]}</p>

            {step === 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {getBusinessTypes(t).map((opt) => (
                  <OptionTile key={opt.value} {...opt} selected={businessType === opt.value} onSelect={handleBusinessTypeSelect} />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-2.5">
                <AnimatePresence initial={false}>
                  {visibleGoals.map((opt) => (
                    <motion.div
                      key={opt.value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                    >
                      <OptionTile {...opt} selected={primaryGoal === opt.value} onSelect={handleGoalSelect} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-2.5">
                {getTeamSizes(t).map((opt) => (
                  <OptionTile key={opt.value} {...opt} selected={teamSize === opt.value} onSelect={handleTeamSizeSelect} />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {/* Language */}
                <LanguagePicker labelClassName="mb-1.5 text-xs font-medium text-muted-foreground" />

                {/* Mode switch */}
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('appearance.displayMode')}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: t('appearance.light'), icon: Sun },
                      { id: 'dark', label: t('appearance.dark'), icon: Moon },
                      { id: 'system', label: t('appearance.system'), icon: Monitor },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all duration-150',
                          theme === id
                            ? 'border-primary bg-primary/10 text-foreground font-semibold'
                            : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.75} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Palette picker */}
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('appearance.colorPalette')}</span>
                  <div className="grid grid-cols-1 gap-2">
                    {COLOR_THEMES.filter((opt) => opt.id !== 'custom').map((opt) => {
                      const isSelected = colorTheme === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setColorTheme(opt.id as ColorTheme)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-150',
                            isSelected
                              ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                              : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="size-5 rounded-full shadow-xs flex items-center justify-center"
                              style={{ background: opt.gradient }}
                            >
                              {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-xs">{t(`appearance.themes.${opt.id}.name`)}</span>
                          </div>
                          <span className="text-[10.5px] text-muted-foreground">{t(`appearance.themes.${opt.id}.description`)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="text-center text-[13px] text-destructive">{error}</p>}

        {step === 3 && (
          <Button size="lg" disabled={!canFinish || saving} onClick={handleSubmit} className="w-full">
            {saving ? t('onboarding.saving') : t('onboarding.submit')}
          </Button>
        )}

        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </AuthCard>
  )
}
