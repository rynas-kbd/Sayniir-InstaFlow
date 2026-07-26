import type { LucideIcon } from 'lucide-react'

type AccentVariant = 'terracotta' | 'sage' | 'sand' | 'primary'

const ACCENT_STYLES: Record<AccentVariant, {
  glow: string
  iconBg: string
  iconColor: string
  valuePulse: string
  sweep: string
  borderHover: string
}> = {
  terracotta: {
    glow: 'color-mix(in srgb, var(--organic-terracotta) 28%, transparent)',
    iconBg: 'color-mix(in srgb, var(--organic-terracotta) 14%, transparent)',
    iconColor: 'var(--organic-terracotta-700)',
    valuePulse: 'color-mix(in srgb, var(--organic-terracotta) 8%, transparent)',
    sweep: 'from-[color-mix(in_srgb,var(--organic-terracotta)_7%,transparent)]',
    borderHover: 'hover:border-[color-mix(in_srgb,var(--organic-terracotta)_30%,transparent)]',
  },
  sage: {
    glow: 'color-mix(in srgb, var(--organic-sage) 28%, transparent)',
    iconBg: 'color-mix(in srgb, var(--organic-sage) 16%, transparent)',
    iconColor: 'var(--organic-sage-700)',
    valuePulse: 'color-mix(in srgb, var(--organic-sage) 8%, transparent)',
    sweep: 'from-[color-mix(in_srgb,var(--organic-sage)_7%,transparent)]',
    borderHover: 'hover:border-[color-mix(in_srgb,var(--organic-sage)_30%,transparent)]',
  },
  sand: {
    glow: 'color-mix(in srgb, var(--organic-sand-500) 28%, transparent)',
    iconBg: 'color-mix(in srgb, var(--organic-sand-400) 20%, transparent)',
    iconColor: 'var(--organic-sand-700)',
    valuePulse: 'color-mix(in srgb, var(--organic-sand-400) 8%, transparent)',
    sweep: 'from-[color-mix(in_srgb,var(--organic-sand-400)_7%,transparent)]',
    borderHover: 'hover:border-[color-mix(in_srgb,var(--organic-sand-500)_30%,transparent)]',
  },
  primary: {
    glow: 'color-mix(in srgb, var(--primary) 20%, transparent)',
    iconBg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
    iconColor: 'var(--primary)',
    valuePulse: 'color-mix(in srgb, var(--primary) 6%, transparent)',
    sweep: 'from-[color-mix(in_srgb,var(--primary)_5%,transparent)]',
    borderHover: 'hover:border-[color-mix(in_srgb,var(--primary)_20%,transparent)]',
  },
}

/**
 * Premium SaaS stat card — colored accent, large tabular number, optional trend.
 * Pass `accent` to give each card its own identity within the organic palette.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent = 'primary',
  description,
}: {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; label?: string }
  accent?: AccentVariant
  description?: string
}) {
  const isPositive = trend ? trend.value > 0 : null
  const a = ACCENT_STYLES[accent]

  return (
    <div
      className={`glass-stat group relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--organic-sand-300)_45%,transparent)] px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${a.borderHover}`}
    >
      {/* Colored aurora glow — top-right quadrant */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-[48px] opacity-60 transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: a.glow }}
      />
      {/* Hover gradient sweep bottom-left */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr ${a.sweep} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Content */}
      <div className="relative flex flex-col gap-4">
        {/* Top row: label + icon */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase leading-tight">
            {title}
          </p>

          {Icon && (
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm"
              style={{
                background: a.iconBg,
                color: a.iconColor,
                boxShadow: `0 2px 8px ${a.glow}`,
              }}
            >
              <Icon className="size-4.5 transition-transform duration-300 group-hover:rotate-6" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Big value */}
        <div>
          <p
            className="text-[2rem] font-bold tracking-tight text-foreground tabular-nums leading-none"
            style={{ textShadow: `0 1px 12px ${a.valuePulse}` }}
          >
            {value}
          </p>

          {/* Trend */}
          {trend && (
            <p
              className={`mt-2 text-[11px] font-semibold flex items-center gap-1 ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="font-normal text-muted-foreground ml-0.5">{trend.label}</span>
              )}
            </p>
          )}

          {/* Optional description */}
          {description && !trend && (
            <p className="mt-2 text-[11px] text-muted-foreground/70 leading-tight">{description}</p>
          )}
        </div>
      </div>

      {/* Thin colored bottom line — accent signature */}
      <div
        className="pointer-events-none absolute bottom-0 left-5 right-5 h-px opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${a.glow}, transparent)` }}
      />
    </div>
  )
}
