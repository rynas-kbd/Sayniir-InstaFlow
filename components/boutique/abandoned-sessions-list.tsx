'use client'

import { Clock3, User, ShoppingBag } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'
import type { AbandonedSession } from './types'

function statusLabel(status: string, t: Translator): { label: string; color: string } {
  if (status === 'selecting_product') {
    return { label: t('boutique.abandonedSessions.status.selectingProduct'), color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' }
  }
  if (status === 'gathering_info') {
    return { label: t('boutique.abandonedSessions.status.gatheringInfo'), color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' }
  }
  return { label: status, color: 'bg-muted text-muted-foreground border-border' }
}

function timeAgo(iso: string, t: Translator): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours < 24) return t('boutique.abandonedSessions.timeAgoHours', { hours })
  const days = Math.floor(hours / 24)
  return t('boutique.abandonedSessions.timeAgoDays', { days })
}

export function AbandonedSessionsList({ sessions }: { sessions: AbandonedSession[] }) {
  const t = useT()

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title={t('boutique.abandonedSessions.emptyTitle')}
        description={t('boutique.abandonedSessions.emptyDescription')}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/50 bg-muted/30 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {t.plural('boutique.abandonedSessions.pendingCount', sessions.length)}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">{t('boutique.abandonedSessions.inactiveThreshold')}</span>
      </div>

      <div className="divide-y divide-border/40">
        {sessions.map((s) => {
          const statusInfo = statusLabel(s.status, t)
          const name = s.customer_name || s.sender_id
          const initials = name.slice(0, 2).toUpperCase()
          const firstItem = s.items?.[0]
          const productLabel = firstItem?.product_name
            ? `${firstItem.product_name}${(s.items?.length ?? 0) > 1 ? ` +${(s.items?.length ?? 1) - 1}` : ''}`
            : s.products?.name ?? t('boutique.abandonedSessions.noProductSelected')

          return (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 shrink-0 place-content-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {initials.length === 2 ? initials : <User className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-foreground">{name}</p>
                    <Badge variant="outline" className={`rounded-full px-2 py-0 text-[10px] font-semibold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShoppingBag className="size-3 text-muted-foreground/70 shrink-0" />
                    <span>{productLabel}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ms-auto sm:ms-0">
                <span className="text-xs font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md">
                  {timeAgo(s.last_message_at, t)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
