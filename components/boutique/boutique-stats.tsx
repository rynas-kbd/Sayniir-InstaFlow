import { TrendingUp, Wallet, Percent, Star, Sparkles } from 'lucide-react'

export interface BoutiqueStats {
  revenue: number
  aov: number
  /** null when there are no order_sessions yet to compute a rate against. */
  conversionRate: number | null
  topProducts: Array<{ name: string; quantity: number }>
}

export function BoutiqueStatsStrip({ stats }: { stats: BoutiqueStats }) {
  const { revenue, aov, conversionRate, topProducts } = stats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <StatTile
        icon={Wallet}
        label="Chiffre d'affaires"
        value={`${revenue.toLocaleString('fr-FR')} DZD`}
        accentColor="var(--organic-terracotta)"
      />
      <StatTile
        icon={TrendingUp}
        label="Panier moyen"
        value={aov > 0 ? `${Math.round(aov).toLocaleString('fr-FR')} DZD` : '—'}
        accentColor="var(--organic-sage)"
      />
      <StatTile
        icon={Percent}
        label="Taux de conversion"
        value={conversionRate !== null ? `${conversionRate.toFixed(1)}%` : '—'}
        accentColor="#3b82f6"
      />
      <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-amber-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5">
            <div className="grid size-6 place-content-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="size-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Top produits</span>
          </div>
          <Sparkles className="size-3 text-amber-500/50" />
        </div>
        {topProducts.length > 0 ? (
          <ul className="space-y-1 mt-1">
            {topProducts.map((p, idx) => (
              <li key={p.name} className="flex items-center justify-between truncate text-xs text-foreground">
                <span className="truncate font-medium">
                  <span className="text-[10px] text-muted-foreground mr-1.5 font-bold">#{idx + 1}</span>
                  {p.name}
                </span>
                <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {p.quantity} vdus
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs italic text-muted-foreground/60">Aucune vente enregistrée</p>
        )}
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  accentColor?: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      {accentColor && (
        <div
          className="absolute inset-y-0 left-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5"
          style={{ background: accentColor }}
        />
      )}
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        <div
          className="grid size-6 place-content-center rounded-md"
          style={{
            background: accentColor ? `color-mix(in srgb, ${accentColor} 12%, transparent)` : 'var(--muted)',
            color: accentColor || 'var(--foreground)',
          }}
        >
          <Icon className="size-3.5" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xl font-extrabold tracking-tight tabular-nums text-foreground">{value}</p>
    </div>
  )
}
