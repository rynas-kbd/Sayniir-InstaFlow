'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Package, Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
      toast.success('Produit supprimé')
    } catch {
      toast.error('Impossible de supprimer le produit')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
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

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Nouveau produit
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit" description="Ajoutez votre premier produit pour démarrer." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.price.toLocaleString('fr-FR')} DZD</TableCell>
                  <TableCell>
                    <Badge variant={product.stock_quantity > 0 ? 'secondary' : 'destructive'}>
                      {product.stock_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[...product.sizes, ...product.colors].join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(product)} aria-label="Modifier">
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(product.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={(next) => !next && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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
