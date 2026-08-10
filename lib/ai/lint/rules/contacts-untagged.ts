import type { LintFinding } from '../types.ts'

const MIN_CONTACTS = 50
const TAGGED_RATIO_THRESHOLD = 0.5

/** Below 50% tagged, segments and campaign targeting become unusable. */
export function checkContactsUntagged(
  account: { id: string },
  totalContacts: number,
  taggedContacts: number
): LintFinding[] {
  if (totalContacts <= MIN_CONTACTS) return []
  if (taggedContacts / totalContacts >= TAGGED_RATIO_THRESHOLD) return []

  return [
    {
      ruleId: 'contacts/untagged',
      scope: 'contacts',
      subjectId: account.id,
      severity: 'info',
      title: `${Math.round((taggedContacts / totalContacts) * 100)}% des contacts sont tagués`,
      detail: 'Sans tags, les segments et le ciblage de campagne perdent leur intérêt.',
      fixToolName: 'create_tag',
      fixToolInput: {},
    },
  ]
}
