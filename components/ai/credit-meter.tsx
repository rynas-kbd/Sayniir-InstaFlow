import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'

export function CreditMeter({ used, limit, className }: { used: number; limit: number; className?: string }) {
  const t = useT()
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const nearLimit = pct >= 80

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('copilot.creditMeter.label')}</span>
        <span className="font-medium text-foreground">
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-300', nearLimit ? 'bg-terracotta-500' : 'bg-sage-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
