import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Zap,
  MessageSquare,
  GitBranch,
  Clock,
  Tag,
  TagIcon,
  Sparkles,
  ArrowRightCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowNodeType } from '../types'

const NODE_META: Record<FlowNodeType, { icon: typeof Zap; label: string; color: string }> = {
  trigger: { icon: Zap, label: 'Déclencheur', color: 'text-primary bg-primary/10 border-primary/20' },
  send_message: { icon: MessageSquare, label: 'Envoyer un message', color: 'text-foreground bg-muted border-border' },
  ai_reply: { icon: Sparkles, label: 'Réponse IA', color: 'text-foreground bg-muted border-border' },
  condition: { icon: GitBranch, label: 'Condition', color: 'text-warning bg-warning/10 border-warning/20' },
  delay: { icon: Clock, label: 'Délai', color: 'text-foreground bg-muted border-border' },
  set_tag: { icon: Tag, label: 'Ajouter un tag', color: 'text-success bg-success/10 border-success/20' },
  remove_tag: { icon: TagIcon, label: 'Retirer un tag', color: 'text-destructive bg-destructive/10 border-destructive/20' },
  jump: { icon: ArrowRightCircle, label: 'Aller vers un flow', color: 'text-foreground bg-muted border-border' },
}

export interface FlowNodeData {
  nodeType: FlowNodeType
  config: Record<string, unknown>
  summary: string
  [key: string]: unknown
}

export function FlowNodeVisual({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData
  const meta = NODE_META[nodeData.nodeType]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'w-56 rounded-lg border-2 bg-card px-3 py-2.5 shadow-sm transition-shadow',
        selected ? 'border-primary shadow-md' : 'border-border'
      )}
    >
      {nodeData.nodeType !== 'trigger' && <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />}

      <div className="flex items-center gap-2">
        <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-md border', meta.color)}>
          <Icon className="size-3.5" />
        </div>
        <span className="text-xs font-semibold text-foreground">{meta.label}</span>
      </div>
      {nodeData.summary && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{nodeData.summary}</p>}

      {nodeData.nodeType === 'condition' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="!bg-success" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="!bg-destructive" />
          <div className="mt-1 flex justify-between text-[9px] font-semibold text-muted-foreground">
            <span className="text-success">Vrai</span>
            <span className="text-destructive">Faux</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} id="default" className="!bg-muted-foreground" />
      )}
    </div>
  )
}
