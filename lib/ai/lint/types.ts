export type LintSeverity = 'error' | 'warning' | 'info'
export type LintScope = 'flow' | 'campaign' | 'account' | 'contacts' | 'automation'

export interface LintFinding {
  ruleId: string
  scope: LintScope
  subjectId: string
  severity: LintSeverity
  title: string
  detail?: string
  fixToolName?: string
  fixToolInput?: Record<string, unknown>
}

/**
 * node_key is only unique within a flow (UNIQUE(flow_id, node_key)), and flow_nodes rows are
 * deleted/reinserted with fresh UUIDs on every graph save — so neither is safe alone as a
 * durable, account-wide ai_insights.subject_id. Namespacing by flow_id keeps it both stable
 * across saves and unique across flows.
 */
export function nodeSubjectId(flowId: string, nodeKey: string): string {
  return `${flowId}:${nodeKey}`
}

/** Inverse of nodeSubjectId — works for flow-level findings too, since flow.id has no ':'. */
export function flowIdFromSubject(subjectId: string): string {
  const separatorIndex = subjectId.indexOf(':')
  return separatorIndex === -1 ? subjectId : subjectId.slice(0, separatorIndex)
}

/** For a scope:'flow' finding whose subject is a node, returns the node_key half. Null for flow-level findings. */
export function nodeKeyFromSubject(subjectId: string): string | null {
  const separatorIndex = subjectId.indexOf(':')
  return separatorIndex === -1 ? null : subjectId.slice(separatorIndex + 1)
}
