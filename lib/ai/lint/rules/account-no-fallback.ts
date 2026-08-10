import type { LintFinding } from '../types.ts'

/** Without a default reply path, messages that match nothing get no response at all. */
export function checkAccountNoFallback(
  account: { id: string },
  defaultMessageEnabled: boolean,
  hasGenericFlow: boolean
): LintFinding[] {
  if (defaultMessageEnabled || hasGenericFlow) return []

  return [
    {
      ruleId: 'account/no-fallback',
      scope: 'account',
      subjectId: account.id,
      severity: 'warning',
      title: 'Aucun message par défaut configuré',
      detail: 'Ni la réponse par défaut ni un flow générique (any_message) ne couvrent les messages qui ne matchent aucune règle.',
      fixToolName: 'update_agent_settings',
      fixToolInput: { defaultMessageEnabled: true },
    },
  ]
}
