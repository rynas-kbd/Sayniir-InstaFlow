import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Unified empty state: quiet icon, one-line title, short description,
 * optional single action. Bordered dashed container keeps it anchored
 * in the layout instead of floating as a card.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-6 py-14 text-center',
        className
      )}
    >
      <Icon className="mb-1 size-4 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
