'use client'

import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiInsight } from './types'
import { useT } from '@/components/i18n-provider'

const SEVERITY_ICON = { error: AlertCircle, warning: AlertTriangle, info: Info } as const
const SEVERITY_COLOR = {
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
} as const

export function InsightCard({ insight, onDismiss }: { insight: AiInsight; onDismiss?: (insight: AiInsight) => void }) {
  const t = useT()
  const Icon = SEVERITY_ICON[insight.severity]

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', SEVERITY_COLOR[insight.severity])} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{insight.title}</p>
        {insight.detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{insight.detail}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(insight)}
          aria-label={t('copilot.insightCard.dismissAriaLabel')}
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
