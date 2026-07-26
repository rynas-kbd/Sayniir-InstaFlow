import type { LintFinding } from '../types'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** A flow active for over a week with zero runs never actually triggers. */
export function checkFlowNoRuns(
  flow: { id: string; status: string; created_at: string },
  runCount: number,
  now: Date = new Date()
): LintFinding[] {
  if (flow.status !== 'active' || runCount > 0) return []
  if (now.getTime() - new Date(flow.created_at).getTime() < SEVEN_DAYS_MS) return []

  return [
    {
      ruleId: 'flow/no-runs',
      scope: 'flow',
      subjectId: flow.id,
      severity: 'warning',
      title: 'Ce flow n\'a jamais été déclenché',
      detail: 'Actif depuis plus de 7 jours sans aucune exécution — le déclencheur ne matche probablement rien.',
    },
  ]
}
