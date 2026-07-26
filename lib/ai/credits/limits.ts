import type { PlanKey } from '../../plans'

export interface AiPlanLimits {
  monthlyCredits: number
  maxToolCallsPerTurn: number
  maxIterationsPerTurn: number
  contextTier: 'compact' | 'full'
  byokAllowed: boolean
}

// Mirrors lib/plans/restrictions.ts::PLAN_LIMITS in shape and convention. Unlike that file,
// every tier here has a genuinely finite monthly cap, so there's no Infinity-serializes-to-null
// hazard to avoid (see docs/AI_NATIVE_DESIGN.md §8.11).
export const AI_PLAN_LIMITS: Record<PlanKey, AiPlanLimits> = {
  free: { monthlyCredits: 30, maxToolCallsPerTurn: 3, maxIterationsPerTurn: 5, contextTier: 'compact', byokAllowed: false },
  pro: { monthlyCredits: 500, maxToolCallsPerTurn: 8, maxIterationsPerTurn: 10, contextTier: 'full', byokAllowed: true },
  premium: { monthlyCredits: 3000, maxToolCallsPerTurn: 12, maxIterationsPerTurn: 12, contextTier: 'full', byokAllowed: true },
}
