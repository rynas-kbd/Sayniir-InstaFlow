import type { LintFinding } from '../types.ts'

/** An active flow does nothing while the account's global flows kill-switch is off. */
export function checkFlowNotEnabled(flow: { id: string; status: string }, flowsEnabled: boolean): LintFinding[] {
  if (flow.status !== 'active' || flowsEnabled) return []

  return [
    {
      ruleId: 'flow/not-enabled',
      scope: 'flow',
      subjectId: flow.id,
      severity: 'error',
      title: 'Ce flow est actif mais ne tournera jamais',
      detail: 'Les flows sont désactivés globalement pour ce compte (agent_settings.flows_enabled = false).',
      fixToolName: 'update_agent_settings',
      fixToolInput: { flowsEnabled: true },
    },
  ]
}
