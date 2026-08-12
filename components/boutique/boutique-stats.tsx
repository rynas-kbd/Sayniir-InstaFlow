'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Wallet, Percent, Trophy, Sparkles, ArrowUpRight, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BoutiqueStats {
  revenue: number
  aov: number
  /** null when there are no order_sessions yet to compute a rate against. */
  conversionRate: number | null
  topProducts: Array<{ name: string; quantity: number }>
}

export function BoutiqueStatsStrip({ stats }: { stats: BoutiqueStats }) {
  const { revenue, aov, conversionRate, topProducts } = stats

  const items = [
    {
      id: 'revenue',
      icon: Wallet,
      label: "Chiffre d'affaires",
      value: `${revenue.toLocaleString('fr-FR')} DZD`,
      subtext: 'Revenus validés',
      badge: 'Global',
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    {
      id: 'aov',
      icon: TrendingUp,
      label: 'Panier moyen',
      value: aov > 0 ? `${Math.round(aov).toLocaleString('fr-FR')} DZD` : '—',
      subtext: 'Par commande',
      badge: 'Moyenne',
      gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
      borderColor: 'group-hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      glow: 'group-hover:shadow-blue-500/10',
    },
    {
      id: 'conversion',
      icon: Percent,
      label: 'Taux de conversion',
      value: conversionRate !== null ? `${conversionRate.toFixed(1)}%` : '—',
      subtext: 'Sessions converties',
      badge: 'Performance',
      gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
      borderColor: 'group-hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'group-hover:shadow-purple-500/10',
    },
  ]

  return (
    <div className="w-full">
      {/* ── Mobile: Smooth Snap Carousel ── */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className="shrink-0 [scroll-snap-align:start] w-[210px]"
          >
            <StatCard {...item} />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="shrink-0 [scroll-snap-align:start] w-[260px]"
        >
          <TopProductsCard topProducts={topProducts} />
        </motion.div>
      </div>

      {/* ── Desktop: 4-Column Grid ── */}
      <div className="hidden lg:grid grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
          >
            <StatCard {...item} />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
        >
          <TopProductsCard topProducts={topProducts} />
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  badge,
  gradient,
  borderColor,
  iconBg,
  glow,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  badge: string
  gradient: string
  borderColor: string
  iconBg: string
  glow: string
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl',
        borderColor,
        glow
      )}
    >
      {/* Background ambient gradient glow on hover */}
      <div
        className={cn(
          'pointer-events-none absolute -inset-px bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          gradient
        )}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
        {/* Card Header: Icon + Badge */}
        <div className="flex items-center justify-between">
          <div className={cn('flex size-9 items-center justify-center rounded-xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-110', iconBg)}>
            <Icon className="size-4" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {badge}
          </span>
        </div>

        {/* Value & Label */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
            {label}
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight tabular-nums text-foreground group-hover:text-primary transition-colors duration-200">
            {value}
          </h3>
        </div>

        {/* Subtext footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10.5px] font-semibold text-muted-foreground/70">
          <span>{subtext}</span>
          <ArrowUpRight className="size-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
        </div>
      </div>
    </div>
  )
}

function TopProductsCard({ topProducts }: { topProducts: Array<{ name: string; quantity: number }> }) {
  const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.quantity), 1) : 1

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 h-full flex flex-col justify-between">
      {/* Glowing top line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/80 to-amber-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <Trophy className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                Top Produits
              </p>
              <p className="text-[10px] text-muted-foreground/70 font-semibold">Meilleures ventes</p>
            </div>
          </div>
          <Sparkles className="size-3.5 text-amber-500/60 animate-pulse" />
        </div>

        {/* List */}
        {topProducts.length > 0 ? (
          <div className="space-y-2 mt-1">
            {topProducts.slice(0, 3).map((p, idx) => {
              const rankColors = [
                'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
                'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
              ]
              const rankMedals = ['🥇', '🥈', '🥉']
              const pct = Math.round((p.quantity / maxQty) * 100)

              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-bold text-foreground flex items-center gap-1.5 max-w-[140px]">
                      <span className={cn('flex size-4 items-center justify-center rounded-full text-[9px] font-black border', rankColors[idx] ?? 'bg-muted text-muted-foreground')}>
                        {rankMedals[idx] ?? `#${idx + 1}`}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground">
                      {p.quantity} <span className="font-semibold text-muted-foreground">vdus</span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 * idx }}
                      className={cn(
                        'h-full rounded-full',
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-3 text-center rounded-xl bg-muted/20 border border-dashed border-border/50">
            <ShoppingBag className="size-5 text-muted-foreground/40 mb-1" />
            <p className="text-[11px] font-semibold text-muted-foreground/70">Aucune vente enregistrée</p>
          </div>
        )}
      </div>
    </div>
  )
}


