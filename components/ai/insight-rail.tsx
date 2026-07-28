'use client'

import { useState } from 'react'
import { InsightCard } from './insight-card'
import type { AiInsight } from './types'

const SEVERITY_RANK: Record<AiInsight['severity'], number> = { error: 2, warning: 1, info: 0 }
const MAX_VISIBLE = 5

/**
 * Standalone dashboard rail — 3 to 5 findings, most severe first — as
 * opposed to InsightBadge (a popover anchored to one specific node/card).
 * The one mount point for every deterministic lint rule that targets
 * scope:'account' (see lib/ai/lint/rules/, in particular the onboarding/*
 * rules added for the Phase 3 activation nudges): those rules had no
 * display surface anywhere in the app before this component existed.
 */
export function InsightRail({ insights: initial }: { insights: AiInsight[] }) {
  const [insights, setInsights] = useState(
    [...initial].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]).slice(0, MAX_VISIBLE)
  )

  if (insights.length === 0) return null

  async function handleDismiss(insight: AiInsight) {
    setInsights((prev) => prev.filter((i) => i.id !== insight.id))
    try {
      const res = await fetch(`/api/ai/insights/${insight.id}/dismiss`, { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch {
      // Best-effort — a failed dismiss just means the finding reappears on
      // next reload, not worth surfacing an error for.
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
