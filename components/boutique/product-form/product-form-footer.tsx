'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Cancel + submit row, placement-agnostic: the create page passes `justify-end` for an inline
 * footer, the edit dialog passes its sticky-footer chrome. Same component either way. */
export function ProductFormFooter({
  saving,
  submitLabel,
  onCancel,
  className,
}: {
  saving: boolean
  submitLabel: string
  onCancel?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
      )}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-3.5 animate-spin" />}
        {saving ? 'Enregistrement…' : submitLabel}
      </Button>
    </div>
  )
}
