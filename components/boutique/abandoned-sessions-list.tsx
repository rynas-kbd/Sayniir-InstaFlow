import { Clock3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { AbandonedSession } from './types'

const STATUS_LABEL: Record<string, string> = {
  selecting_product: 'Choix du produit',
  gathering_info: 'Informations de livraison',
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

/**
 * order_sessions stuck mid-conversation (not confirmed, not cancelled, no
 * message in 2h+) are a ready-made abandoned-cart list — nothing new to
 * build, just never read anywhere. Read-only: a merchant follows up
 * manually via the inbox, there's no automated recovery flow here.
 */
export function AbandonedSessionsList({ sessions }: { sessions: AbandonedSession[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title="Aucun panier abandonné"
        description="Les conversations commencées mais jamais confirmées (plus de 2h sans réponse) apparaîtront ici."
      />
    )
  }

  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{s.customer_name || s.sender_id}</p>
            <p className="truncate text-xs text-muted-foreground">
              {s.products?.name ?? 'Produit non sélectionné'} · {STATUS_LABEL[s.status] ?? s.status}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(s.last_message_at)}</span>
        </div>
      ))}
    </div>
  )
}
