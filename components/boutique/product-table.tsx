'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Edit2, Trash2, Search, SlidersHorizontal, X, Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
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
import { productToCardView } from './product-card-view'
import { ProductImportActions } from './product-import-actions'
import { PRODUCT_KINDS } from './product-kinds'
import type { Product, ProductKind } from './types'

const PAGE_SIZE = 24
type ActiveFilter = 'all' | 'active' | 'inactive'
type KindFilter = 'all' | ProductKind

export function ProductTable({ channelAccountId, initialProducts }: { channelAccountId: string; initialProducts: Product[] }) {
  const t = useT()
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const activeFilterCount = [
    kindFilter !== 'all',
    activeFilter !== 'all',
    categoryFilter !== 'all',
  ].filter(Boolean).length

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

  // Selects/deselects every FILTERED product (search + active filters), not
  // just the currently-paginated `visible` slice — a product revealed later
  // via "Charger plus" just reads `selected.has(id)` like any other card, so
  // it shows up already checked with no extra wiring.
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

  // Shared tri-state icon (checked / indeterminate / empty) for the two
  // "Tout sélectionner" controls below — a plain button rather than the
  // Checkbox primitive, which doesn't expose an indeterminate state.
  const selectAllIcon = (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
        allFilteredSelected ? 'border-primary bg-primary text-primary-foreground' : someFilteredSelected ? 'border-primary/60 bg-primary/15 text-primary' : 'border-input',
      )}
    >
      {allFilteredSelected ? <Check className="size-3" strokeWidth={3} /> : someFilteredSelected ? <Minus className="size-3" strokeWidth={3} /> : null}
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
        }),
      ),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast.error(t.plural('boutique.productTable.toast.bulkUpdateError', failed))
    else toast.success(
      nextActive
        ? t.plural('boutique.productTable.toast.bulkActivateSuccess', ids.length)
        : t.plural('boutique.productTable.toast.bulkDeactivateSuccess', ids.length),
    )
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    const results = await Promise.allSettled(ids.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' }).then((r) => {
      if (!r.ok) throw new Error()
    })))
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id) || failedIds.includes(p.id)))
    if (failedIds.length > 0) toast.error(t.plural('boutique.productTable.toast.bulkDeleteError', failedIds.length))
    else toast.success(t.plural('boutique.productTable.toast.bulkDeleteSuccess', ids.length))
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

      {/* ── Filter bottom sheet (mobile) ── */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4 max-h-[80dvh] overflow-y-auto">
          <SheetHeader className="mb-4 flex-row items-center justify-between">
            <SheetTitle className="text-base font-extrabold">{t('boutique.productTable.filters.sheetTitle')}</SheetTitle>
            <button
              onClick={() => setFilterSheetOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              aria-label={t('boutique.productTable.filters.closeAria')}
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('boutique.productTable.filters.kindLabel')}</p>
              <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v as KindFilter); setVisibleCount(PAGE_SIZE) }}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t('boutique.productTable.filters.kindPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('boutique.productTable.filters.kindAll')}</SelectItem>
                  {PRODUCT_KINDS.map((k) => (
                    <SelectItem key={k.key} value={k.key}>{t(k.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('boutique.productTable.filters.statusLabel')}</p>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as ActiveFilter); setVisibleCount(PAGE_SIZE) }}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t('boutique.productTable.filters.statusPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('boutique.productTable.filters.statusAll')}</SelectItem>
                  <SelectItem value="active">{t('boutique.productTable.filters.statusActive')}</SelectItem>
                  <SelectItem value="inactive">{t('boutique.productTable.filters.statusInactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categories.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('boutique.productTable.filters.categoryLabel')}</p>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE) }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t('boutique.productTable.filters.categoryPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('boutique.productTable.filters.categoryAll')}</SelectItem>
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
              onClick={() => { setKindFilter('all'); setActiveFilter('all'); setCategoryFilter('all'); setVisibleCount(PAGE_SIZE) }}
            >
              {t('boutique.productTable.filters.reset')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Search + filter controls ── */}
      <div className="mb-4 flex items-center gap-2">
        {/* Always-available "select all" — doesn't require selecting a card by hand first. */}
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-2 text-muted-foreground transition-colors hover:text-foreground sm:px-3"
            aria-label={allFilteredSelected ? t('boutique.productTable.deselectAll') : t('boutique.productTable.selectAll')}
          >
            {selectAllIcon}
            <span className="hidden text-[11px] font-extrabold uppercase tracking-wider sm:inline">{t('boutique.productTable.selectAll')}</span>
          </button>
        )}

        {/* Search — full width on mobile */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            placeholder={t('boutique.productTable.searchPlaceholder')}
            className="ps-8"
          />
        </div>

        {/* Mobile: filter button */}
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0 sm:hidden"
          onClick={() => setFilterSheetOpen(true)}
          aria-label={t('boutique.productTable.filters.openAria')}
        >
          <SlidersHorizontal className="size-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Desktop: inline filters */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v as KindFilter); setVisibleCount(PAGE_SIZE) }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('boutique.productTable.filters.kindPlaceholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('boutique.productTable.filters.kindAll')}</SelectItem>
              {PRODUCT_KINDS.map((k) => (
                <SelectItem key={k.key} value={k.key}>{t(k.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as ActiveFilter); setVisibleCount(PAGE_SIZE) }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder={t('boutique.productTable.filters.statusPlaceholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('boutique.productTable.filters.statusAll')}</SelectItem>
              <SelectItem value="active">{t('boutique.productTable.filters.statusActive')}</SelectItem>
              <SelectItem value="inactive">{t('boutique.productTable.filters.statusInactive')}</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE) }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('boutique.productTable.filters.categoryPlaceholder')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('boutique.productTable.filters.categoryAll')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="ms-auto hidden sm:block">
          <ProductImportActions channelAccountId={channelAccountId} onImported={handleImported} />
        </div>
      </div>

      {/* Mobile import actions */}
      <div className="mb-3 flex sm:hidden">
        <ProductImportActions channelAccountId={channelAccountId} onImported={handleImported} />
      </div>

      {/* Bulk actions — sticky bottom on mobile, inline on desktop */}
      {selected.size > 0 && (
        <>
          {/* Mobile sticky bar */}
          <div className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden items-center gap-2 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-2xl">
            <button type="button" onClick={toggleSelectAll} className="flex items-center gap-1.5" aria-label={allFilteredSelected ? t('boutique.productTable.deselectAll') : t('boutique.productTable.selectAll')}>
              {selectAllIcon}
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">{t('boutique.productTable.bulkBar.selectedCountMobile', { count: selected.size })}</span>
            </button>
            <div className="ms-auto flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(true)}>{t('boutique.productTable.bulkBar.activate')}</Button>
              <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}>{t('boutique.productTable.bulkBar.deleteShort')}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X className="size-3.5" /></Button>
            </div>
          </div>
          {/* Desktop inline bar */}
          <div className="hidden sm:flex mb-4 items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-2.5">
            <button type="button" onClick={toggleSelectAll} className="flex items-center gap-1.5" aria-label={allFilteredSelected ? t('boutique.productTable.deselectAll') : t('boutique.productTable.selectAll')}>
              {selectAllIcon}
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">{t.plural('boutique.productTable.bulkBar.selectedCount', selected.size)}</span>
            </button>
            <div className="ms-auto flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(true)}>{t('boutique.productTable.bulkBar.activate')}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => handleBulkSetActive(false)}>{t('boutique.productTable.bulkBar.deactivate')}</Button>
              <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}>{t('boutique.productTable.bulkBar.delete')}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>{t('boutique.productTable.bulkBar.cancel')}</Button>
            </div>
          </div>
        </>
      )}

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
        <EmptyState icon={Search} title={t('boutique.productTable.emptyState.noResultsTitle')} description={t('boutique.productTable.emptyState.noResultsDescription')} />
      ) : (
        <>
          <motion.div
            layout
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
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
                  className="relative"
                >
                  <ProductCard
                    view={productToCardView(product, t)}
                    onToggleActive={(next: boolean) => handleToggleActive(product, next)}
                    selectable
                    selected={selected.has(product.id)}
                    onToggleSelected={() => toggleSelected(product.id)}
                    actions={
                      <>
                        <button
                          onClick={() => setDeletingId(product.id)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 cursor-pointer"
                          aria-label={t('boutique.productTable.actions.deleteAria')}
                        >
                          <Trash2 className="size-3.5" />
                          {t('boutique.productTable.actions.delete')}
                        </button>

                        <button
                          onClick={() => setEditing(product)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 text-[11px] font-extrabold text-primary transition-all active:scale-95 cursor-pointer"
                          aria-label={t('boutique.productTable.actions.editAria')}
                        >
                          <Edit2 className="size-3.5" />
                          {t('boutique.productTable.actions.edit')}
                        </button>
                      </>
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add product card tile inside the grid */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(visible.length * 0.04, 0.3) }}
            >
              <Link
                href="/boutique/products/new"
                className="group flex min-h-[220px] h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-card/40 p-6 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5 shadow-sm active:scale-[0.98]"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                  <Plus className="size-6" />
                </div>
                <div className="text-center">
                  <span className="block text-sm font-extrabold tracking-tight text-foreground group-hover:text-primary">{t('boutique.productTable.addTile.title')}</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{t('boutique.productTable.addTile.subtitle')}</span>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {visibleCount < filtered.length && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                {t.plural('boutique.productTable.loadMore', filtered.length - visibleCount)}
              </Button>
            </div>
          )}
        </>
      )}

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
