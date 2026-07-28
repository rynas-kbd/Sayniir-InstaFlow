'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/components/auth/auth-card'

type BusinessType = 'ecommerce' | 'coaching' | 'agency' | 'generic'
type PrimaryGoal = 'reply_faster' | 'automate_faq' | 'convert_comments' | 'qualify_leads' | 'sell_more'
type TeamSize = 'solo' | '2-5' | '6-20' | '20+'

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string; icon: typeof ShoppingBag }> = [
  { value: 'ecommerce', label: 'Boutique en ligne', icon: ShoppingBag },
  { value: 'coaching', label: 'Coaching / rendez-vous', icon: CalendarClock },
  { value: 'agency', label: 'Agence / leads', icon: Target },
  { value: 'generic', label: 'Autre', icon: Sparkles },
]

// Mirrors GOAL_TO_TEMPLATE_ID in lib/onboarding/steps.ts — keep the value set in sync.
const PRIMARY_GOALS: Array<{ value: PrimaryGoal; label: string; icon: typeof MessageSquareText }> = [
  { value: 'reply_faster', label: 'Répondre plus vite aux DM', icon: MessageSquareText },
  { value: 'automate_faq', label: 'Automatiser les questions fréquentes', icon: HelpCircle },
  { value: 'convert_comments', label: 'Convertir mes commentaires', icon: MousePointerClick },
  { value: 'qualify_leads', label: 'Qualifier mes prospects', icon: Bot },
]

// Boutique-only — only makes sense once business_type = 'ecommerce', shown
// conditionally below. Activates the ecommerce sales agent directly (see
// activation-checklist.tsx), not just a flow like the other goals.
const SELL_MORE_GOAL: { value: PrimaryGoal; label: string; icon: typeof TrendingUp } = {
  value: 'sell_more',
  label: 'Vendre plus (automatiser mes ventes)',
  icon: TrendingUp,
}

const TEAM_SIZES: Array<{ value: TeamSize; label: string; icon: typeof User }> = [
  { value: 'solo', label: 'Solo', icon: User },
  { value: '2-5', label: '2 à 5', icon: Users },
  { value: '6-20', label: '6 à 20', icon: UsersRound },
  { value: '20+', label: '20+', icon: Building2 },
]

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
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-center transition-all duration-200',
        selected
          ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
          : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
      )}
    >
      <Icon className={cn('size-4.5', selected ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
      <span className={cn('text-[11.5px] font-semibold leading-tight', selected ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </button>
  )
}

function QuestionBlock({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
          {step}
        </span>
        {title}
      </p>
      {children}
    </div>
  )
}

export function WelcomeForm() {
  const router = useRouter()
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null)
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = businessType !== null
  const visibleGoals = businessType === 'ecommerce' ? [...PRIMARY_GOALS, SELL_MORE_GOAL] : PRIMARY_GOALS

  function handleBusinessTypeSelect(value: BusinessType) {
    setBusinessType(value)
    // 'sell_more' only exists for boutiques — switching away from ecommerce
    // must not silently submit a goal that's no longer offered or valid.
    if (value !== 'ecommerce' && primaryGoal === 'sell_more') {
      setPrimaryGoal(null)
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: businessType, primary_goal: primaryGoal, team_size: teamSize }),
      })
      if (!res.ok) throw new Error()
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError("Une erreur est survenue, réessayez.")
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

  return (
    <AuthCard tagline="Personnalisons votre espace en 30 secondes">
        <div className="flex flex-col gap-6">
          <QuestionBlock step={1} title="Quelle est votre activité ?">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BUSINESS_TYPES.map((opt) => (
                <OptionTile key={opt.value} {...opt} selected={businessType === opt.value} onSelect={handleBusinessTypeSelect} />
              ))}
            </div>
          </QuestionBlock>

          <QuestionBlock step={2} title="Votre objectif principal ?">
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence initial={false}>
                {visibleGoals.map((opt) => (
                  <motion.div
                    key={opt.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                  >
                    <OptionTile {...opt} selected={primaryGoal === opt.value} onSelect={setPrimaryGoal} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </QuestionBlock>

          <QuestionBlock step={3} title="Combien êtes-vous ?">
            <div className="grid grid-cols-4 gap-2">
              {TEAM_SIZES.map((opt) => (
                <OptionTile key={opt.value} {...opt} selected={teamSize === opt.value} onSelect={setTeamSize} />
              ))}
            </div>
          </QuestionBlock>

          {error && <p className="text-center text-[13px] text-destructive">{error}</p>}

          <Button size="lg" disabled={!canSubmit || saving} onClick={handleSubmit} className="w-full">
            {saving ? 'Un instant…' : 'Continuer'}
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Passer pour l&apos;instant
          </button>
        </div>
    </AuthCard>
  )
}
