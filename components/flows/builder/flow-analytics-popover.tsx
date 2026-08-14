'use client'

import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FlowFunnelSummary } from '@/lib/flows/analytics'
import { useT } from '@/components/i18n-provider'

export function FlowAnalyticsPopover({ funnel }: { funnel: FlowFunnelSummary }) {
  const t = useT()
  const NODE_LABELS: Record<string, string> = {
    trigger: t('flows.nodeTypes.trigger.short'),
    send_message: t('flows.nodeTypes.send_message.short'),
    ai_reply: t('flows.nodeTypes.ai_reply.short'),
    condition: t('flows.nodeTypes.condition.short'),
    delay: t('flows.nodeTypes.delay.short'),
    set_tag: t('flows.nodeTypes.set_tag.short'),
    remove_tag: t('flows.nodeTypes.remove_tag.short'),
    jump: t('flows.nodeTypes.jump.short'),
    capture_input: t('flows.nodeTypes.capture_input.short'),
    external_request: t('flows.nodeTypes.external_request.short'),
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <BarChart3 className="size-3.5" /> {t('flows.builder.analyticsPopover.trigger')}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="mb-2.5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div>
            <p className="text-base font-bold text-foreground tabular-nums">{funnel.totalRuns}</p>
            <p className="text-[10px] text-muted-foreground">{t('flows.builder.analyticsPopover.total')}</p>
          </div>
          <div>
            <p className="text-base font-bold text-success tabular-nums">{funnel.completed}</p>
            <p className="text-[10px] text-muted-foreground">{t('flows.builder.analyticsPopover.completed')}</p>
          </div>
          <div>
            <p className="text-base font-bold text-warning tabular-nums">{funnel.active}</p>
            <p className="text-[10px] text-muted-foreground">{t('flows.builder.analyticsPopover.inProgress')}</p>
          </div>
          <div>
            <p className="text-base font-bold text-destructive tabular-nums">{funnel.failed}</p>
            <p className="text-[10px] text-muted-foreground">{t('flows.builder.analyticsPopover.failures')}</p>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('flows.builder.analyticsPopover.funnelTitle')}</p>
          {funnel.nodes.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">{t('flows.builder.analyticsPopover.noData')}</p>
          ) : (
            <div className="space-y-1.5">
              {funnel.nodes.map((n) => {
                const pct = funnel.totalRuns > 0 ? Math.round((n.reached / funnel.totalRuns) * 100) : 0
                return (
                  <div key={n.node_key}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-foreground">{NODE_LABELS[n.node_type] ?? n.node_type}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {n.reached} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
