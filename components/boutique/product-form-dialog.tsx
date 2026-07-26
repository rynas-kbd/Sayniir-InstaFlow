'use client'

import { Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { FormDialogHeader } from '@/components/shared/form-section'
import { ProductFormFields } from './product-form-fields'
import type { Product } from './types'

export function ProductFormDialog({
  open,
  channelAccountId,
  product,
  onSave,
  onClose,
}: {
  open: boolean
  channelAccountId: string
  product?: Product
  onSave: (data: Partial<Product> & { channel_account_id: string }) => Promise<void>
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <FormDialogHeader
            icon={Package}
            title={product ? 'Modifier le produit' : 'Nouveau produit'}
            description="Renseignez les informations affichées à vos clients."
          />
        </DialogHeader>
        <ProductFormFields channelAccountId={channelAccountId} product={product} onSave={onSave} onSaved={onClose} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}
