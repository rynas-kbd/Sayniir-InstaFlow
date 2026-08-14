'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { InsightCard } from './insight-card'
import type { AiInsight } from './types'
import { useT } from '@/components/i18n-provider'

const SEVERITY_RANK: Record<AiInsight['severity'], number> = { error: 2, warning: 1, info: 0 }

const SEVERITY_STYLE: Record<AiInsight['severity'], string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-border bg-muted text-muted-foreground',
}

const SEVERITY_ICON = { error: AlertCircle, warning: AlertTriangle, info: Info } as const

function topSeverity(insights: AiInsight[]): AiInsight['severity'] {
  return insights.reduce<AiInsight['severity']>(
    (acc, i) => (SEVERITY_RANK[i.severity] > SEVERITY_RANK[acc] ? i.severity : acc),
    'info'
  )
}

/** Compact badge shown on an existing UI element (node, card) — never a standalone "AI" affordance. */
export function InsightBadge({ insights: initial, className }: { insights: AiInsight[]; className?: string }) {
  const t = useT()
  const [insights, setInsights] = useState(initial)
  const [open, setOpen] = useState(false)

  if (insights.length === 0) return null

  async function handleDismiss(insight: AiInsight) {
    setInsights((prev) => prev.filter((i) => i.id !== insight.id))
    try {
      const res = await fetch(`/api/ai/insights/${insight.id}/dismiss`, { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch {
      setInsights((prev) => [...prev, insight])
      toast.error(t('copilot.insightBadge.dismissError'))
    }
  }

  const severity = topSeverity(insights)
  const Icon = SEVERITY_ICON[severity]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition-transform hover:scale-105',
          SEVERITY_STYLE[severity],
          className
        )}
        aria-label={t.plural('copilot.insightBadge.ariaLabel', insights.length)}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon className="size-3" />
        {insights.length}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-2" onClick={(e) => e.stopPropagation()}>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
        ))}
      </PopoverContent>
    </Popover>
  )
}
