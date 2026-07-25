import type { LucideIcon } from 'lucide-react'

/**
 * Premium SaaS stat card — icon top-left, large tabular number, optional trend.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; label?: string }
}) {
  const isPositive = trend ? trend.value > 0 : null

  return (
    <div className="glass-stat group relative overflow-hidden rounded-2xl px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Inner glow spot — reinforces glass refraction */}
      <div className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full blur-2xl opacity-40"
        style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 30%, transparent)' }} />
      {/* Hover gradient sweep */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="font-normal text-muted-foreground ml-0.5">{trend.label}</span>}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-all duration-300 group-hover:scale-105 group-hover:from-primary/20 group-hover:to-primary/8 shadow-sm shadow-primary/10 backdrop-blur-sm">
            <Icon className="size-4.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}
