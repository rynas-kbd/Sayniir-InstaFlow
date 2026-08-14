'use client'

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { useT } from '@/components/i18n-provider'
import { PostSelector } from './post-selector'

/** Dialog on desktop, bottom sheet on mobile — used where the picker can't just replace
 * the host's own view inline (e.g. the flow builder's 320px inspector sidebar). */
export function PostPickerDialog({
  open,
  accountId,
  selectedIds,
  onSelect,
  onClose,
}: {
  open: boolean
  accountId: string
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onClose: () => void
}) {
  const t = useT()

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <ResponsiveDialogContent className="overflow-hidden p-5 sm:max-w-2xl">
        {/* PostSelector renders its own visible "Sélectionner des posts" heading —
            this title only satisfies the dialog's a11y labelling requirement. */}
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>{t('shared.postPicker.title')}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <PostSelector accountId={accountId} selectedIds={selectedIds} onSelect={onSelect} onClose={onClose} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
