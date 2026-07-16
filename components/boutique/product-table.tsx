'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Package, Plus, Edit2, Trash2, Box, Layers, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { Product } from './types'

export function ProductTable({ channelAccountId, initialProducts }: { channelAccountId: string; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(data: Partial<Product> & { channel_account_id: string }) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
    const created: Product = await res.json()
    setProducts((prev) => [created, ...prev])
  }

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
      {(showForm || editing) && (
        <ProductFormDialog
          open
          channelAccountId={channelAccountId}
          product={editing}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false)
            setEditing(undefined)
          }}
        />
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit dans le catalogue"
          description="Créez votre premier produit pour que l'IA puisse le proposer à vos clients dans le chat."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" /> Ajouter mon premier produit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const hasStock = product.stock_quantity > 0
            const hasVariations = product.sizes.length > 0 || product.colors.length > 0

            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                {/* Covers/Icons */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Box className="size-5" />
                  </div>
                  
                  {/* Stock status badge */}
                  <Badge
                    variant={hasStock ? 'secondary' : 'destructive'}
                    className={`text-[10px] font-medium py-0 px-2.5 rounded-full border ${
                      hasStock
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                    }`}
                  >
                    {hasStock ? `${product.stock_quantity} en stock` : 'Rupture'}
                  </Badge>
                </div>

                {/* Details */}
                <div>
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</h3>
                  <p className="mt-1 text-base font-bold text-foreground">
                    {product.price.toLocaleString('fr-FR')} DZD
                  </p>
                </div>

                {/* Variations */}
                <div className="mt-3.5 flex-1 flex flex-col justify-end gap-1 border-t border-border/40 pt-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                    <Layers className="size-3" /> Variantes
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1 min-h-[22px]">
                    {hasVariations ? (
                      <>
                        {[...product.sizes, ...product.colors].slice(0, 4).map((variant, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[9px] py-0 px-1.5 font-normal text-muted-foreground border-border/60"
                          >
                            {variant}
                          </Badge>
                        ))}
                        {[...product.sizes, ...product.colors].length > 4 && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-muted-foreground border-border/60">
                            +{[...product.sizes, ...product.colors].length - 4}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">— Aucune</span>
                    )}
                  </div>
                </div>

                {/* Card hover controls */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                  <button
                    onClick={() => setDeletingId(product.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Supprimer produit"
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </button>

                  <button
                    onClick={() => setEditing(product)}
                    className="flex items-center gap-1 rounded-md bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                    aria-label="Modifier produit"
                  >
                    <Edit2 className="size-3.5" />
                    Modifier
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add product card tile inside the grid */}
          <button
            onClick={() => setShowForm(true)}
            className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
          >
            <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
              <Plus className="size-5" />
            </div>
            <span className="text-sm font-medium">Nouveau produit</span>
          </button>
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
