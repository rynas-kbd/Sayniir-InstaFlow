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
import type { FlowNodeType, CardButton } from '../types'

const NODE_META: Record<FlowNodeType, { icon: typeof Zap; label: string }> = {
  trigger: { icon: Zap, label: 'Déclencheur' },
  send_message: { icon: MessageSquare, label: 'Envoyer un message' },
  ai_reply: { icon: Sparkles, label: 'Réponse IA' },
  condition: { icon: GitBranch, label: 'Condition' },
  delay: { icon: Clock, label: 'Délai' },
  set_tag: { icon: Tag, label: 'Ajouter un tag' },
  remove_tag: { icon: TagIcon, label: 'Retirer un tag' },
  jump: { icon: ArrowRightCircle, label: 'Aller vers un flow' },
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
  const isTrigger = nodeData.nodeType === 'trigger'
  const postbackButtons =
    nodeData.nodeType === 'send_message'
      ? ((nodeData.config.card_buttons as CardButton[] | undefined) ?? []).filter((b) => b.type === 'postback')
      : []

  return (
    <div
      className={cn(
        'w-52 rounded-md border bg-card px-3 py-2.5 transition-shadow',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      )}
    >
      {!isTrigger && <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />}

      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-3 shrink-0', isTrigger ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
        <span className="text-xs font-medium text-foreground">{meta.label}</span>
      </div>
      {nodeData.summary && <p className="mt-1 truncate text-[11px] text-muted-foreground">{nodeData.summary}</p>}

      {nodeData.nodeType === 'condition' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="!bg-success" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="!bg-destructive" />
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Vrai</span>
            <span>Faux</span>
          </div>
        </>
      ) : postbackButtons.length > 0 ? (
        <>
          {postbackButtons.map((btn, idx) => (
            <Handle
              key={idx}
              type="source"
              position={Position.Bottom}
              id={`btn-${idx}`}
              style={{ left: `${((idx + 1) / (postbackButtons.length + 1)) * 100}%` }}
              className="!bg-primary"
            />
          ))}
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            {postbackButtons.map((btn, idx) => (
              <span key={idx} className="truncate">{btn.title || `Bouton ${idx + 1}`}</span>
            ))}
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} id="default" className="!bg-muted-foreground" />
      )}
    </div>
  )
}
