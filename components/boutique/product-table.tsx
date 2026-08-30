'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Minus,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  ArrowUpDown,
  Filter,
  Eye,
  Boxes,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { ProductFormDialog } from './product-form-dialog'
import { ProductCard } from './product-card'
import { ProductDenseTable } from './product-dense-table'
import { ProductDetailDrawer } from './product-detail-drawer'
import { productToCardView } from './product-card-view'
import { ProductImportActions } from './product-import-actions'
import { PRODUCT_KINDS, PRODUCT_KIND_META } from './product-kinds'
import type { Product, ProductKind } from './types'

const PAGE_SIZE = 24
type ViewMode = 'grid' | 'table'
type StatusFilter = 'all' | 'active' | 'inactive' | 'out_of_stock'
type KindFilter = 'all' | ProductKind
type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'stock'

export function ProductTable({
  channelAccountId,
  initialProducts,
}: {
  channelAccountId: string
  initialProducts: Product[]
}) {
  const t = useT()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Layout & Controls State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const activeFilterCount = [
    kindFilter !== 'all',
    statusFilter !== 'all',
    categoryFilter !== 'all',
  ].filter(Boolean).length

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
    [products]
  )

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false
      if (statusFilter === 'active' && !p.is_active) return false
      if (statusFilter === 'inactive' && p.is_active) return false
      if (statusFilter === 'out_of_stock' && (p.kind !== 'physical' || (p.stock_quantity ?? 0) > 0)) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      return true
    })

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortOption === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
      if (sortOption === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
      if (sortOption === 'stock') return (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0)
      const bDate = (b as unknown as { created_at?: string }).created_at || 0
      const aDate = (a as unknown as { created_at?: string }).created_at || 0
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    return list
  }, [products, search, kindFilter, statusFilter, categoryFilter, sortOption])

  const visible = filtered.slice(0, visibleCount)

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const someFilteredSelected = filtered.some((p) => selected.has(p.id))

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((p) => p.id)))
  }

  const selectAllIcon = (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
        allFilteredSelected
          ? 'border-primary bg-primary text-primary-foreground'
          : someFilteredSelected
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-input'
      )}
    >
      {allFilteredSelected ? (
        <Check className="size-3" strokeWidth={3} />
      ) : someFilteredSelected ? (
        <Minus className="size-3" strokeWidth={3} />
      ) : null}
    </span>
  )

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
    toast.success('Produit mis à jour avec succès')
  }

  function handleImported(imported: Product[]) {
    setProducts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]))
      for (const p of imported) byId.set(p.id, p)
      return Array.from(byId.values())
    })
  }

  async function handleToggleActive(product: Product, nextActive: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: nextActive } : p)))
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(nextActive ? t('boutique.productTable.toast.activated') : t('boutique.productTable.toast.deactivated'))
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p)))
      toast.error(t('boutique.productTable.toast.toggleError'))
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success(t('boutique.productTable.toast.deleted'))
    } catch {
      toast.error(t('boutique.productTable.toast.deleteError'))
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
        })
      )
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast.error(t.plural('boutique.productTable.toast.bulkUpdateError', failed))
    else
      toast.success(
        nextActive
          ? t.plural('boutique.productTable.toast.bulkActivateSuccess', ids.length)
          : t.plural('boutique.productTable.toast.bulkDeactivateSuccess', ids.length)
      )
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error()
      }))
    )
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id) || failedIds.includes(p.id)))
    if (failedIds.length > 0) toast.error(t.plural('boutique.productTable.toast.bulkDeleteError', failedIds.length))
    else toast.success(t.plural('boutique.productTable.toast.bulkDeleteSuccess', ids.length))
    setSelected(new Set())
    setBulkDeleteOpen(false)
  }

  return (
    <div className="pt-2 space-y-4">
      {/* Edit Form Dialog */}
      {editing && (
        <ProductFormDialog
          open
          channelAccountId={channelAccountId}
          product={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(undefined)}
        />
      )}

      {/* Product Detail & Bot Preview Drawer */}
      <ProductDetailDrawer
        product={inspectingProduct}
        open={inspectingProduct !== null}
        onOpenChange={(open) => !open && setInspectingProduct(null)}
        onEdit={(p) => setEditing(p)}
        onDelete={(id) => setDeletingId(id)}
        onToggleActive={handleToggleActive}
      />

      {/* Mobile Filter Bottom Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-4 max-h-[85dvh] overflow-y-auto">
          <SheetHeader className="mb-4 flex-row items-center justify-between">
            <SheetTitle className="text-lg font-black">{t('boutique.productTable.filters.sheetTitle')}</SheetTitle>
            <button
              onClick={() => setFilterSheetOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type de produit</p>
              <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v as KindFilter); setVisibleCount(PAGE_SIZE) }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {PRODUCT_KINDS.map((k) => (
                    <SelectItem key={k.key} value={k.key}>{t(k.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</p>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setVisibleCount(PAGE_SIZE) }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">🟢 Actifs uniquement</SelectItem>
                  <SelectItem value="inactive">⚪ Masqués</SelectItem>
                  <SelectItem value="out_of_stock">⚠️ En rupture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categories.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Catégorie</p>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE) }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => { setKindFilter('all'); setStatusFilter('all'); setCategoryFilter('all'); setVisibleCount(PAGE_SIZE) }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Toolbar Section ── */}
      <div className="flex flex-col gap-3">
        {/* Top Control Bar: Search, Add Product Button, View Mode Toggle */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder="Rechercher par nom, description..."
              className="ps-9 h-10 rounded-xl bg-card border-border/60 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Add Product & View Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <Button render={<Link href="/boutique/products/new" />} size="sm" className="h-10 rounded-xl px-4 font-bold shadow-md">
              <Plus className="size-4 me-1.5" />
              Nouveau produit
            </Button>

            <ProductImportActions channelAccountId={channelAccountId} onImported={handleImported} />

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-card text-primary shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Vue Grille Visuelle"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-primary shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Vue Tableau Data"
              >
                <TableIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Kind Chips & Filter Controls Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Product Kind Chips */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setKindFilter('all'); setVisibleCount(PAGE_SIZE) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none whitespace-nowrap border',
                kindFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/40'
              )}
            >
              Tous
            </button>
            {PRODUCT_KINDS.map((k) => {
              const isActive = kindFilter === k.key
              const meta = PRODUCT_KIND_META[k.key]
              const Icon = meta.icon
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => { setKindFilter(k.key); setVisibleCount(PAGE_SIZE) }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none whitespace-nowrap border',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/40'
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(k.label)}
                </button>
              )
            })}
          </div>

          {/* Sort & Status Selectors */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setVisibleCount(PAGE_SIZE) }}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">🟢 Actifs</SelectItem>
                <SelectItem value="inactive">⚪ Masqués</SelectItem>
                <SelectItem value="out_of_stock">⚠️ En rupture</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[150px] h-8 text-xs rounded-lg border-border/60">
                <ArrowUpDown className="size-3 me-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="price_asc">Prix : croissant</SelectItem>
                <SelectItem value="price_desc">Prix : décroissant</SelectItem>
                <SelectItem value="stock">Stock disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Floating Glass Bar ── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:end-8 z-50 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-background/90 backdrop-blur-xl p-3 sm:px-5 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 font-bold text-xs text-foreground"
              >
                {selectAllIcon}
                <span>{selected.size} produit(s) sélectionné(s)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(true)} className="h-8 text-xs font-bold">
                Activer
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(false)} className="h-8 text-xs font-bold">
                Masquer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Supprimer
              </Button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Products Display (Grid vs Table) ── */}
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('boutique.productTable.emptyState.noProductsTitle')}
          description={t('boutique.productTable.emptyState.noProductsDescription')}
          action={
            <Button render={<Link href="/boutique/products/new" />}>
              <Plus className="size-4" /> {t('boutique.productTable.emptyState.addFirstProduct')}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('boutique.productTable.emptyState.noResultsTitle')}
          description={t('boutique.productTable.emptyState.noResultsDescription')}
        />
      ) : viewMode === 'grid' ? (
        <>
          <motion.div layout className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(idx * 0.04, 0.3),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ProductCard
                    view={productToCardView(product, t)}
                    onToggleActive={(next: boolean) => handleToggleActive(product, next)}
                    selectable
                    selected={selected.has(product.id)}
                    onToggleSelected={() => toggleSelected(product.id)}
                    onInspect={() => setInspectingProduct(product)}
                    onEdit={() => setEditing(product)}
                    onDelete={() => setDeletingId(product.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Quick Add Product Card Tile */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(visible.length * 0.04, 0.3) }}
            >
              <Link
                href="/boutique/products/new"
                className="group flex min-h-[240px] h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-card/40 p-6 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5 shadow-sm active:scale-[0.98]"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                  <Plus className="size-6" />
                </div>
                <div className="text-center">
                  <span className="block text-sm font-extrabold tracking-tight text-foreground group-hover:text-primary">
                    {t('boutique.productTable.addTile.title')}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                    {t('boutique.productTable.addTile.subtitle')}
                  </span>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                {t.plural('boutique.productTable.loadMore', filtered.length - visibleCount)}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Data Dense Table View */
        <ProductDenseTable
          products={filtered}
          selectedIds={selected}
          onToggleSelect={toggleSelected}
          onToggleSelectAll={toggleSelectAll}
          allSelected={allFilteredSelected}
          someSelected={someFilteredSelected}
          onInspect={(p) => setInspectingProduct(p)}
          onEdit={(p) => setEditing(p)}
          onDelete={(id) => setDeletingId(id)}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deletingId !== null} onOpenChange={(next) => !next && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('boutique.productTable.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('boutique.productTable.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('boutique.productTable.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('boutique.productTable.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.plural('boutique.productTable.bulkDeleteDialog.title', selected.size)}</AlertDialogTitle>
            <AlertDialogDescription>{t('boutique.productTable.bulkDeleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('boutique.productTable.bulkDeleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('boutique.productTable.bulkDeleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
