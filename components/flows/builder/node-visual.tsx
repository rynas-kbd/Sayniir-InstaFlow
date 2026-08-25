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
        'relative w-56 rounded-xl border bg-card/95 backdrop-blur-md px-3.5 py-3 transition-all duration-200 ease-out shadow-sm select-none',
        selected
          ? 'border-primary ring-4 ring-primary/25 shadow-xl scale-[1.02] z-20'
          : 'border-border/80 hover:border-primary/40 hover:shadow-md'
      )}
    >
      {nodeData.insights && nodeData.insights.length > 0 && (
        <InsightBadge insights={nodeData.insights} className="absolute -end-2 -top-2 z-10 bg-card shadow-sm" />
      )}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !bg-primary !border-2 !border-background shadow-md !-top-2 hover:scale-125 transition-transform cursor-pointer"
        />
      )}

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors',
            isTrigger ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-foreground tracking-tight">{metaLabel}</span>
      </div>
      {nodeData.summary && <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground/80">{nodeData.summary}</p>}

      {nodeData.nodeType === 'condition' ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '30%' }}
            className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '70%' }}
            className="!w-4 !h-4 !bg-rose-500 !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
          />
          <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400">{t('flows.builder.nodeVisual.trueLabel')}</span>
            <span className="text-rose-600 dark:text-rose-400">{t('flows.builder.nodeVisual.falseLabel')}</span>
          </div>
        </>
      ) : nodeData.nodeType === 'split_test' ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="a"
            style={{ left: '30%' }}
            className="!w-4 !h-4 !bg-primary !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="b"
            style={{ left: '70%' }}
            className="!w-4 !h-4 !bg-purple-500 !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
          />
          <div className="mt-2 flex justify-between text-[10px] font-bold text-muted-foreground">
            <span className="text-primary">{t('flows.builder.nodeVisual.splitLabel', { letter: 'A', pct: (nodeData.config.percentage_a as number) ?? 50 })}</span>
            <span className="text-purple-600 dark:text-purple-400">{t('flows.builder.nodeVisual.splitLabel', { letter: 'B', pct: 100 - ((nodeData.config.percentage_a as number) ?? 50) })}</span>
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
              className="!w-4 !h-4 !bg-primary !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
            />
          ))}
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-muted-foreground">
            {postbackButtons.map((btn, idx) => (
              <span key={idx} className="truncate">{btn.title || t('flows.builder.nodeVisual.buttonFallback', { index: idx + 1 })}</span>
            ))}
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="!w-4 !h-4 !bg-primary !border-2 !border-background shadow-md !-bottom-2 hover:scale-125 transition-transform cursor-pointer"
        />
      )}
    </div>
  )
}
