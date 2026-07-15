import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'primary'

/**
 * Linear-style status: a small colored dot next to plain text.
 * Replaces filled color badges for state display — color carries the
 * state, text stays in ink so it reads at any size.
 */
export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: StatusTone
  label: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span
        aria-hidden
        className={cn('size-1.5 shrink-0 rounded-full', {
          'bg-success': tone === 'success',
          'bg-warning': tone === 'warning',
          'bg-destructive': tone === 'destructive',
          'bg-muted-foreground/50': tone === 'neutral',
          'bg-primary': tone === 'primary',
        })}
      />
      {label}
    </span>
  )
}
