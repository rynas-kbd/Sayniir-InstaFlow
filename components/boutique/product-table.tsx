'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
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
import { ProductImportActions } from './product-import-actions'
import { PRODUCT_KINDS } from './product-kinds'
import type { Product, ProductKind } from './types'

const PAGE_SIZE = 24
type ActiveFilter = 'all' | 'active' | 'inactive'
type KindFilter = 'all' | ProductKind

export function ProductTable({ channelAccountId, initialProducts }: { channelAccountId: string; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false
      if (activeFilter === 'active' && !p.is_active) return false
      if (activeFilter === 'inactive' && p.is_active) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      return true
    })
  }, [products, search, kindFilter, activeFilter, categoryFilter])

  const visible = filtered.slice(0, visibleCount)

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  function handleImported(imported: Product[]) {
    setProducts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]))
      for (const p of imported) byId.set(p.id, p)
      return Array.from(byId.values())
    })
  }

  async function handleToggleActive(product: Product, nextActive: boolean) {
    // Optimistic — the toggle should feel instant; roll back on failure.
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: nextActive } : p)))
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(nextActive ? 'Produit activé' : 'Produit désactivé — masqué du catalogue proposé par l’IA')
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p)))
      toast.error('Impossible de mettre à jour le produit')
    }
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

  async function handleBulkSetActive(nextActive: boolean) {
    const ids = Array.from(selected)
    setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, is_active: nextActive } : p)))
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: nextActive }),
        }).then((r) => {
          if (!r.ok) throw new Error()
        }),
      ),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast.error(`${failed} produit(s) n'ont pas pu être mis à jour`)
    else toast.success(`${ids.length} produit(s) ${nextActive ? 'activés' : 'désactivés'}`)
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    const results = await Promise.allSettled(ids.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' }).then((r) => {
      if (!r.ok) throw new Error()
    })))
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id) || failedIds.includes(p.id)))
    if (failedIds.length > 0) toast.error(`${failedIds.length} produit(s) n'ont pas pu être supprimés`)
    else toast.success(`${ids.length} produit(s) supprimé(s)`)
    setSelected(new Set())
    setBulkDeleteOpen(false)
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            placeholder="Rechercher un produit…"
            className="pl-8"
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v as KindFilter); setVisibleCount(PAGE_SIZE) }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {PRODUCT_KINDS.map((k) => (
              <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as ActiveFilter); setVisibleCount(PAGE_SIZE) }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE) }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto">
          <ProductImportActions channelAccountId={channelAccountId} onImported={handleImported} />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-xs font-medium text-foreground">{selected.size} sélectionné(s)</span>
          <div className="ml-auto flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(true)}>Activer</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(false)}>Désactiver</Button>
            <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}>
              Supprimer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Annuler</Button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit dans le catalogue"
          description="Créez votre premier produit pour que l'IA puisse le proposer à vos clients dans le chat, ou importez un fichier CSV/JSON et un Google Sheet ci-dessus."
          action={
            <Button render={<Link href="/boutique/products/new" />}>
              <Plus className="size-4" /> Ajouter mon premier produit
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Aucun produit ne correspond à ces filtres." />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <div key={product.id} className="relative">
                <Checkbox
                  checked={selected.has(product.id)}
                  onCheckedChange={() => toggleSelected(product.id)}
                  className="absolute left-2 top-2 z-10 bg-card"
                  aria-label={`Sélectionner ${product.name}`}
                />
                <ProductCard
                  view={productToCardView(product)}
                  onToggleActive={(next) => handleToggleActive(product, next)}
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
              </div>
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

          {visibleCount < filtered.length && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Charger plus ({filtered.length - visibleCount} restants)
              </Button>
            </div>
          )}
        </>
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selected.size} produit(s) ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
