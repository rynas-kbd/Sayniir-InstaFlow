'use client'

import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FlowFunnelSummary } from '@/lib/flows/analytics'

const NODE_LABELS: Record<string, string> = {
  trigger: 'Déclencheur',
  send_message: 'Message',
  ai_reply: 'Réponse IA',
  condition: 'Condition',
  delay: 'Délai',
  set_tag: 'Ajouter tag',
  remove_tag: 'Retirer tag',
  jump: 'Aller vers',
  capture_input: 'Enregistrer réponse',
  external_request: 'Requête externe',
}

export function FlowAnalyticsPopover({ funnel }: { funnel: FlowFunnelSummary }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <BarChart3 className="size-3.5" /> Analytics
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="mb-2.5 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-base font-bold text-foreground tabular-nums">{funnel.totalRuns}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-base font-bold text-emerald-600 tabular-nums dark:text-emerald-400">{funnel.completed}</p>
            <p className="text-[10px] text-muted-foreground">Terminés</p>
          </div>
          <div>
            <p className="text-base font-bold text-amber-600 tabular-nums dark:text-amber-400">{funnel.active}</p>
            <p className="text-[10px] text-muted-foreground">En cours</p>
          </div>
          <div>
            <p className="text-base font-bold text-destructive tabular-nums">{funnel.failed}</p>
            <p className="text-[10px] text-muted-foreground">Échecs</p>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entonnoir par nœud</p>
          {funnel.nodes.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">Aucune donnée.</p>
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
