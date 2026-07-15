import type { LucideIcon } from 'lucide-react'

/**
 * Stripe-style stat: quiet label above a large tabular number.
 * The icon is optional and rendered inline at label weight — never
 * in a colored box.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string | number
  icon?: LucideIcon
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" strokeWidth={1.75} />}
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
    </div>
  )
}
