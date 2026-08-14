'use client'

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
  ListPlus,
  Globe,
  SplitSquareHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowNodeType, CardButton } from '../types'
import { InsightBadge } from '@/components/ai/insight-badge'
import type { AiInsight } from '@/components/ai/types'
import { useT } from '@/components/i18n-provider'

const NODE_META: Record<FlowNodeType, { icon: typeof Zap }> = {
  trigger: { icon: Zap },
  send_message: { icon: MessageSquare },
  ai_reply: { icon: Sparkles },
  condition: { icon: GitBranch },
  delay: { icon: Clock },
  set_tag: { icon: Tag },
  remove_tag: { icon: TagIcon },
  jump: { icon: ArrowRightCircle },
  capture_input: { icon: ListPlus },
  external_request: { icon: Globe },
  split_test: { icon: SplitSquareHorizontal },
}

export interface FlowNodeData {
  nodeType: FlowNodeType
  config: Record<string, unknown>
  summary: string
  insights?: AiInsight[]
  [key: string]: unknown
}

export function FlowNodeVisual({ data, selected }: NodeProps) {
  const t = useT()
  const nodeData = data as unknown as FlowNodeData
  const meta = NODE_META[nodeData.nodeType] ?? { icon: Zap }
  const metaLabel = NODE_META[nodeData.nodeType]
    ? t(`flows.nodeTypes.${nodeData.nodeType}.label`)
    : String(nodeData.nodeType || t('flows.nodeTypes.unknown'))
  const Icon = meta.icon
  const isTrigger = nodeData.nodeType === 'trigger'
  const postbackButtons =
    nodeData.nodeType === 'send_message'
      ? ((nodeData.config.card_buttons as CardButton[] | undefined) ?? []).filter((b) => b.type === 'postback')
      : []

  return (
    <div
      className={cn(
        'relative w-52 rounded-md border bg-card px-3 py-2.5 transition-shadow',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      )}
    >
      {nodeData.insights && nodeData.insights.length > 0 && (
        <InsightBadge insights={nodeData.insights} className="absolute -end-2 -top-2 z-10 bg-card" />
      )}
      {!isTrigger && <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />}

      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-3 shrink-0', isTrigger ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
        <span className="text-xs font-medium text-foreground">{metaLabel}</span>
      </div>
      {nodeData.summary && <p className="mt-1 truncate text-[11px] text-muted-foreground">{nodeData.summary}</p>}

      {nodeData.nodeType === 'condition' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="!bg-success" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="!bg-destructive" />
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{t('flows.builder.nodeVisual.trueLabel')}</span>
            <span>{t('flows.builder.nodeVisual.falseLabel')}</span>
          </div>
        </>
      ) : nodeData.nodeType === 'split_test' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="a" style={{ left: '30%' }} className="!bg-primary" />
          <Handle type="source" position={Position.Bottom} id="b" style={{ left: '70%' }} className="!bg-sage-500" />
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{t('flows.builder.nodeVisual.splitLabel', { letter: 'A', pct: (nodeData.config.percentage_a as number) ?? 50 })}</span>
            <span>{t('flows.builder.nodeVisual.splitLabel', { letter: 'B', pct: 100 - ((nodeData.config.percentage_a as number) ?? 50) })}</span>
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
              <span key={idx} className="truncate">{btn.title || t('flows.builder.nodeVisual.buttonFallback', { index: idx + 1 })}</span>
            ))}
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} id="default" className="!bg-muted-foreground" />
      )}
    </div>
  )
}
