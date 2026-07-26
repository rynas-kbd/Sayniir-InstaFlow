'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProductFormDialog } from './product-form-dialog'
import { ProductCard } from './product-card'
import { productToCardView } from './product-card-view'
import type { Product } from './types'

export function ProductTable({ channelAccountId, initialProducts }: { channelAccountId: string; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpdate(data: Partial<Product> & { channel_account_id: string }) {
    if (!editing) return
    const res = await fetch(`/api/products/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
    const updated: Product = await res.json()
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditing(undefined)
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('📦 Produit supprimé')
    } catch {
      toast.error('Impossible de supprimer le produit')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="pt-4">
      {editing && (
        <ProductFormDialog
          open
          channelAccountId={channelAccountId}
          product={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(undefined)}
        />
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit dans le catalogue"
          description="Créez votre premier produit pour que l'IA puisse le proposer à vos clients dans le chat."
          action={
            <Button render={<Link href="/boutique/products/new" />}>
              <Plus className="size-4" /> Ajouter mon premier produit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              view={productToCardView(product)}
              actions={
                <>
                  <button
                    onClick={() => setDeletingId(product.id)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all active:scale-95"
                    aria-label="Supprimer produit"
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </button>

                  <button
                    onClick={() => setEditing(product)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/8 hover:bg-primary/14 px-3.5 py-1.5 text-[11px] font-bold text-primary transition-all active:scale-95"
                    aria-label="Modifier produit"
                  >
                    <Edit2 className="size-3.5" />
                    Modifier
                  </button>
                </>
              }
            />
          ))}

          {/* Add product card tile inside the grid */}
          <Link
            href="/boutique/products/new"
            className="group flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
          >
            <div className="flex size-11 items-center justify-center rounded-xl border border-dashed border-current/30 transition-all group-hover:border-primary/40 group-hover:bg-primary/8">
              <Plus className="size-5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Nouveau produit</span>
          </Link>
        </div>
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(next) => !next && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera retiré du catalogue et l&apos;IA ne pourra plus le vendre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
