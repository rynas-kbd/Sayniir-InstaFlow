import type { LintScope, LintSeverity } from '@/lib/ai/lint/types'

export interface AiInsight {
  id: string
  ruleId: string
  scope: LintScope
  subjectId: string
  severity: LintSeverity
  title: string
  detail: string | null
  fixToolName: string | null
  fixToolInput: Record<string, unknown> | null
}

interface AiInsightRow {
  id: string
  rule_id: string
  scope: LintScope
  subject_id: string
  severity: LintSeverity
  title: string
  detail: string | null
  fix_tool_name: string | null
  fix_tool_input: Record<string, unknown> | null
}

export function mapAiInsightRow(row: AiInsightRow): AiInsight {
  return {
    id: row.id,
    ruleId: row.rule_id,
    scope: row.scope,
    subjectId: row.subject_id,
    severity: row.severity,
    title: row.title,
    detail: row.detail,
    fixToolName: row.fix_tool_name,
    fixToolInput: row.fix_tool_input,
  }
}
