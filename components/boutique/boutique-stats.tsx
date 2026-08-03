import { TrendingUp, Wallet, Percent, Star } from 'lucide-react'

export interface BoutiqueStats {
  revenue: number
  aov: number
  /** null when there are no order_sessions yet to compute a rate against. */
  conversionRate: number | null
  topProducts: Array<{ name: string; quantity: number }>
}

/**
 * The boutique had zero analytics — the hero banner only showed raw
 * product/order counts. Computed server-side in app/(app)/boutique/page.tsx
 * from the same `orders`/`order_sessions` already queried there.
 */
export function BoutiqueStatsStrip({ stats }: { stats: BoutiqueStats }) {
  const { revenue, aov, conversionRate, topProducts } = stats

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={Wallet} label="Chiffre d'affaires" value={`${revenue.toLocaleString('fr-FR')} DZD`} />
      <StatTile icon={TrendingUp} label="Panier moyen" value={aov > 0 ? `${Math.round(aov).toLocaleString('fr-FR')} DZD` : '—'} />
      <StatTile
        icon={Percent}
        label="Taux de conversion"
        value={conversionRate !== null ? `${conversionRate.toFixed(0)}%` : '—'}
      />
      <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="size-3.5" />
          <span className="text-[10.5px] font-semibold uppercase tracking-wider">Top produits</span>
        </div>
        {topProducts.length > 0 ? (
          <ul className="mt-1.5 space-y-0.5">
            {topProducts.map((p) => (
              <li key={p.name} className="truncate text-[12.5px] text-foreground">
                {p.name} <span className="text-muted-foreground">· {p.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">—</p>
        )}
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10.5px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
