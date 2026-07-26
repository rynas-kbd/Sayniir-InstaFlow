import type { FlowNode } from '@/lib/flows/types'
import { nodeSubjectId, type LintFinding } from '../types'

const ONE_DAY_SECONDS = 86400

/** A delay longer than the daily cron cadence resolves up to 24h late. */
export function checkFlowDelayExceedsCron(flow: { id: string }, nodes: FlowNode[]): LintFinding[] {
  return nodes
    .filter((n) => n.type === 'delay' && Number(n.config.seconds) > ONE_DAY_SECONDS)
    .map((n) => ({
      ruleId: 'flow/delay-exceeds-cron',
      scope: 'flow' as const,
      subjectId: nodeSubjectId(flow.id, n.node_key),
      severity: 'warning' as const,
      title: 'Ce délai peut se résoudre avec jusqu\'à 24h de retard',
      detail: `Le nœud "${n.node_key}" attend ${Math.round(Number(n.config.seconds) / 3600)}h — la reprise passe par le cron quotidien.`,
      fixToolName: undefined,
      fixToolInput: undefined,
    }))
}
