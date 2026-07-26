'use client'

import { Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { FormDialogHeader } from '@/components/shared/form-section'
import { useProductForm } from './product-form/use-product-form'
import { ProductFormBody } from './product-form/product-form-body'
import { ProductFormFooter } from './product-form/product-form-footer'
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
  const api = useProductForm({ channelAccountId, product, onSave, onSaved: onClose })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Popup defaults to grid gap-4 overflow-y-auto p-4 (dialog.tsx) — all four are overridden
       * here so the header/footer can stay pinned while only the body scrolls. */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-card/60 px-5 py-4 pr-12 backdrop-blur-sm">
          <FormDialogHeader
            icon={Package}
            title={product ? 'Modifier le produit' : 'Nouveau produit'}
            description="Renseignez les informations affichées à vos clients."
          />
        </DialogHeader>

        <form onSubmit={api.submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ProductFormBody api={api} />
          </div>
          <ProductFormFooter
            saving={api.saving}
            submitLabel={product ? 'Sauvegarder' : 'Créer'}
            onCancel={onClose}
            className="shrink-0 justify-end border-t border-border bg-muted/40 px-5 py-3"
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
