'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, Plus, Edit2, Trash2, Box, Layers, Calendar, Clock, FileText, Repeat, Ticket } from 'lucide-react'
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
import type { Product, ProductKind } from './types'

const KIND_LABELS: Record<ProductKind, string> = {
  physical: 'Physique',
  service: 'Service',
  digital: 'Digital',
  subscription: 'Abonnement',
  event: 'Événement',
}

const KIND_ICONS: Record<ProductKind, typeof Box> = {
  physical: Box,
  service: Clock,
  digital: FileText,
  subscription: Repeat,
  event: Ticket,
}

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
          {products.map((product) => {
            const kind = product.kind ?? 'physical'
            const isPhysical = kind === 'physical'
            const hasStock = product.stock_quantity > 0
            const hasVariations = product.sizes.length > 0 || product.colors.length > 0
            const KindIcon = KIND_ICONS[kind]
            const metadata = product.metadata ?? {}

            const optionBadges: string[] = isPhysical
              ? [...product.sizes, ...product.colors]
              : kind === 'service'
                ? [
                    ...(metadata.duration_minutes ? [`${metadata.duration_minutes} min`] : []),
                    ...(metadata.location ? [metadata.location] : []),
                  ]
                : kind === 'subscription'
                  ? [metadata.billing_period === 'yearly' ? 'Facturation annuelle' : 'Facturation mensuelle']
                  : kind === 'event'
                    ? [
                        ...(metadata.event_date ? [metadata.event_date] : []),
                        ...(metadata.remaining != null ? [`${metadata.remaining} places restantes`] : []),
                      ]
                    : kind === 'digital'
                      ? [...(metadata.file_url ? ['Fichier lié'] : []), ...(metadata.download_limit ? [`${metadata.download_limit} téléch. max`] : [])]
                      : []

            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 overflow-hidden"
              >
                {/* Accent Top Bar */}
                {(!isPhysical || hasStock) && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-success/50 via-success to-success/50" />
                )}

                {/* Covers/Icons Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary shadow-inner transition-transform duration-300 group-hover:scale-105">
                    <KindIcon className="size-5.5" strokeWidth={1.75} />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold py-0.5 px-3 rounded-full border-border/80 bg-muted/20 text-muted-foreground"
                    >
                      {KIND_LABELS[kind]}
                    </Badge>
                    {isPhysical && (
                      <Badge
                        variant={hasStock ? 'secondary' : 'destructive'}
                        className={`text-[10px] font-bold py-0.5 px-3 rounded-full border transition-all ${
                          hasStock
                            ? 'bg-success/8 text-success border-success/15'
                            : 'bg-destructive/8 text-destructive border-destructive/15'
                        }`}
                      >
                        {hasStock ? `${product.stock_quantity} en stock` : 'Rupture'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-1.5 min-h-[60px]">
                  <h3 className="line-clamp-1 text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="line-clamp-2 text-[11.5px] text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-auto pt-1 text-[15px] font-extrabold text-[var(--organic-terracotta-700)] dark:text-[var(--organic-terracotta-600)] tracking-tight">
                    {product.price.toLocaleString('fr-FR')} {product.currency ?? 'DZD'}
                  </p>
                </div>

                {/* Kind-specific details */}
                <div className="mt-4 flex flex-col justify-end gap-1.5 border-t border-border/30 pt-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 flex items-center gap-1.5">
                    <Layers className="size-3" /> {isPhysical ? 'Options' : 'Détails'}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1 min-h-[22px]">
                    {optionBadges.length > 0 || hasVariations ? (
                      <>
                        {optionBadges.slice(0, 4).map((variant, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] py-0 px-2 font-medium text-muted-foreground/90 border-border/80 bg-muted/10 rounded-md"
                          >
                            {variant}
                          </Badge>
                        ))}
                        {optionBadges.length > 4 && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium text-muted-foreground/80 border-border/80 bg-muted/10 rounded-md">
                            +{optionBadges.length - 4}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50 italic pl-1">— Standard</span>
                    )}
                  </div>
                </div>

                {/* Card hover controls */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/30 pt-3 bg-card">
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
                </div>
              </div>
            )
          })}

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
