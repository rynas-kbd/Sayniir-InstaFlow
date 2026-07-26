import type { FlowNode } from '@/lib/flows/types'
import { nodeSubjectId, type LintFinding } from '../types'

/** An ai_reply node fails silently in prod if no provider key resolves for the account. */
export function checkFlowAiReplyNoKey(flow: { id: string }, nodes: FlowNode[], aiKeyResolved: boolean): LintFinding[] {
  if (aiKeyResolved) return []
  const node = nodes.find((n) => n.type === 'ai_reply')
  if (!node) return []

  return [
    {
      ruleId: 'flow/ai-reply-no-key',
      scope: 'flow',
      subjectId: nodeSubjectId(flow.id, node.node_key),
      severity: 'error',
      title: 'Ce nœud IA échouera silencieusement',
      detail: `Le nœud "${node.node_key}" appelle un fournisseur IA sans clé API configurée.`,
      fixToolName: 'update_agent_settings',
      fixToolInput: {},
    },
  ]
}
