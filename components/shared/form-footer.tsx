'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Cancel + submit row, placement-agnostic: an inline create page passes `justify-end`, an edit
 * dialog passes its sticky-footer chrome. Same component either way. Promoted from the boutique
 * product form (`ProductFormFooter`) — it never had any product-specific logic, so campaigns and
 * automation rules import this directly rather than each growing their own copy. */
export function FormFooter({
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
