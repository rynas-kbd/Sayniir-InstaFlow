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
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:border-border/80 hover:shadow-sm">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-1 text-[11px] font-medium ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              {trend.label && <span className="ml-1 font-normal text-muted-foreground">{trend.label}</span>}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </div>
  )
}
