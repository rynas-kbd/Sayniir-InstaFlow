'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  MapPin, 
  Package, 
  Calendar, 
  Search, 
  Check, 
  X, 
  Eye, 
  Trash2, 
  Clock, 
  AlertCircle
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { Order } from './types'

const PAGE_SIZE = 25
type OrderCategory = 'to_validate' | 'validated' | 'cancelled'

function OrderDetailSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Sheet open={order !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-border/40 pb-4">
          <SheetTitle className="font-heading text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            Détails de la commande
          </SheetTitle>
        </SheetHeader>
        {order && (
          <div className="space-y-6 pt-6 text-sm">
            {/* Client Info */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">Informations Client</p>
              <div>
                <p className="font-bold text-foreground text-base">{order.customer_name}</p>
                <p className="text-muted-foreground font-mono mt-0.5">{order.customer_phone}</p>
              </div>
              {order.contact && (order.contact.username || order.contact.full_name) && (
                <div className="pt-2 border-t border-border/40 mt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Contact CRM : {order.contact.username ? `@${order.contact.username}` : order.contact.full_name}
                  </span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">Détail du produit</p>
              <div className="rounded-xl border border-border/60 p-4 bg-card shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-snug">{order.product_name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {order.size && (
                        <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-bold uppercase">
                          Taille : {order.size}
                        </Badge>
                      )}
                      {order.color && (
                        <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-bold uppercase">
                          Couleur : {order.color}
                        </Badge>
                      )}
                      <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-bold">
                        Quantité : {order.quantity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-black text-foreground text-base tabular-nums mt-0.5">
                      {order.total_amount.toLocaleString('fr-FR')} {order.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">Livraison & Adresse</p>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{order.wilaya ?? 'Wilaya non précisée'}</span>
                  {order.delivery_mode && (
                    <Badge className="ml-auto bg-[var(--organic-sage-100)] text-[var(--organic-sage-800)] border border-[var(--organic-sage-300)] rounded-md py-0 px-2 text-[10px] font-bold">
                      {order.delivery_mode === 'domicile' ? 'À Domicile' : 'Point Retrait'}
                    </Badge>
                  )}
                </div>
                {order.shipping_address ? (
                  <p className="text-muted-foreground text-xs leading-relaxed pl-5 mt-1">{order.shipping_address}</p>
                ) : (
                  <p className="text-muted-foreground text-xs italic pl-5 mt-1">Aucune adresse de livraison renseignée.</p>
                )}
              </div>
            </div>

            {/* General Info */}
            <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Créé le {new Date(order.created_at).toLocaleString('fr-FR')}
              </span>
              <span className="flex items-center gap-1">
                Réf: <span className="font-mono text-[10px]">{order.id.slice(0, 8)}...</span>
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function OrderTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<OrderCategory>('to_validate')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [hoveredSubTab, setHoveredSubTab] = useState<OrderCategory | null>(null)

  // Recalculate counts of items inside each category tab
  const counts = useMemo(() => {
    return {
      to_validate: orders.filter((o) => o.shipping_status === 'pending').length,
      validated: orders.filter((o) => o.shipping_status === 'shipped' || o.shipping_status === 'delivered').length,
      cancelled: orders.filter((o) => o.shipping_status === 'cancelled').length,
    }
  }, [orders])

  // Unified status update handler
  async function updateOrderStatus(id: string, updates: Partial<Pick<Order, 'shipping_status' | 'payment_status'>>) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Erreur')
      const updated: Order = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      
      if (updates.shipping_status === 'shipped') {
        toast.success('Commande validée et marquée comme payée & expédiée !')
      } else if (updates.shipping_status === 'cancelled') {
        toast.success('Commande marquée comme annulée')
      } else {
        toast.success('Commande mise à jour')
      }
    } catch {
      toast.error('Impossible de modifier le statut de la commande')
    }
  }

  // Delete handler (alternative action)
  async function deleteOrder(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer définitivement cette commande ?')) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setOrders((prev) => prev.filter((o) => o.id !== id))
      toast.success('Commande supprimée définitivement')
    } catch {
      toast.error('Impossible de supprimer la commande')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null
    
    return orders.filter((o) => {
      // Category filter logic
      if (category === 'to_validate') {
        if (o.shipping_status !== 'pending') return false
      } else if (category === 'validated') {
        if (o.shipping_status !== 'shipped' && o.shipping_status !== 'delivered') return false
      } else if (category === 'cancelled') {
        if (o.shipping_status !== 'cancelled') return false
      }

      // Query filter
      if (q && !`${o.customer_name} ${o.customer_phone} ${o.product_name}`.toLowerCase().includes(q)) return false
      
      // Date filter
      const created = new Date(o.created_at).getTime()
      if (from !== null && created < from) return false
      if (to !== null && created > to) return false
      return true
    })
  }, [orders, search, category, dateFrom, dateTo])

  const visible = filtered.slice(0, visibleCount)

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Aucune commande"
        description="Les commandes prises par l'IA en conversation apparaîtront ici. Activez la prise de commande dans l'onglet Config IA si ce n'est pas déjà fait."
      />
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* ── Sub-Tabs Menu ── */}
      <div 
        className="relative flex items-center gap-1.5 border-b border-border/60 pb-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseLeave={() => setHoveredSubTab(null)}
      >
        {(['to_validate', 'validated', 'cancelled'] as const).map((cat) => {
          const isActive = category === cat
          const isHovered = hoveredSubTab === cat
          const label = cat === 'to_validate' ? 'À valider' : cat === 'validated' ? 'Validées' : 'Annulées'
          const count = counts[cat]
          
          return (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setVisibleCount(PAGE_SIZE) }}
              onMouseEnter={() => setHoveredSubTab(cat)}
              className={cn(
                'group relative flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors select-none cursor-pointer',
                isActive 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active styling */}
              {isActive && (
                <motion.div
                  layoutId="activeOrderSubtab"
                  className="absolute inset-0 z-0 bg-muted/60 border border-border/40 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {/* Hover styling */}
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverOrderSubtab"
                  className="absolute inset-0 z-0 bg-muted/30 border border-border/20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                />
              )}
              
              <span className="relative z-10">{label}</span>
              {count > 0 && (
                <span className={cn(
                  'relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'bg-muted/80 text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
            placeholder="Rechercher client, téléphone, produit…"
            className="pl-8 h-9 rounded-xl border-border bg-card/60 backdrop-blur-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-[140px] h-9 rounded-xl border-border bg-card/60" />
          <span className="text-muted-foreground text-xs font-semibold">à</span>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-[140px] h-9 rounded-xl border-border bg-card/60" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Aucune commande ne correspond à ces filtres." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          {/* Header — desktop only */}
          <div className="hidden grid-cols-[1.4fr_1.4fr_0.8fr_1.2fr_0.8fr] gap-x-4 border-b border-border/80 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/75 bg-muted/15 md:grid">
            <span className="flex items-center gap-1.5"><Package className="size-3" /> Client</span>
            <span>Produit</span>
            <span>Total</span>
            <span>Statut / Actions</span>
            <span className="flex items-center gap-1.5"><Calendar className="size-3" /> Date</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/60">
            <AnimatePresence mode="popLayout">
              {visible.map((order) => {
                const initials = order.customer_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                const dateLabel = new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

                return (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Desktop row */}
                    <div className="hidden grid-cols-[1.4fr_1.4fr_0.8fr_1.2fr_0.8fr] items-center gap-x-4 px-4 py-3.5 transition-colors hover:bg-muted/15 md:grid">
                      {/* Client Info */}
                      <button
                        type="button"
                        onClick={() => setDetailOrder(order)}
                        className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg group/btn"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20 transition-transform group-hover/btn:scale-105">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-foreground hover:text-primary transition-colors">{order.customer_name}</p>
                          <p className="truncate text-xs font-medium text-muted-foreground/80 font-mono mt-0.5">
                            {order.customer_phone}
                            {order.contact && (order.contact.username || order.contact.full_name) && (
                              <span className="ml-1.5 rounded bg-muted/80 border border-border/40 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                                CRM
                              </span>
                            )}
                          </p>
                        </div>
                      </button>

                      {/* Product details */}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-foreground">
                          {order.product_name}
                        </p>
                        <div className="flex flex-wrap gap-1 items-center mt-0.5 text-xs text-muted-foreground/80 font-medium">
                          {order.size && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{order.size}</Badge>}
                          {order.color && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{order.color}</Badge>}
                          <span>Qté {order.quantity}</span>
                        </div>
                      </div>

                      {/* Total price */}
                      <p className="whitespace-nowrap text-sm font-black text-foreground tabular-nums">
                        {order.total_amount.toLocaleString('fr-FR')}
                        <span className="ml-0.5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{order.currency}</span>
                      </p>

                      {/* Actions column */}
                      <div className="flex items-center gap-1.5">
                        {category === 'to_validate' ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'shipped', payment_status: 'paid' })}
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 px-3 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <Check className="size-3.5 stroke-[2.5]" />
                              Valider
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'cancelled' })}
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Annuler la commande"
                            >
                              <X className="size-4 stroke-[2.5]" />
                            </Button>
                          </>
                        ) : category === 'validated' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Check className="size-3 stroke-[2.5]" />
                              Validée
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'pending', payment_status: 'pending' })}
                              className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Remettre en attente"
                            >
                              <Clock className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                              <X className="size-3 stroke-[2.5]" />
                              Annulée
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'pending' })}
                              className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Remettre en attente"
                            >
                              <Clock className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOrder(order.id)}
                              className="size-7 text-muted-foreground hover:text-destructive rounded-lg"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums font-semibold">{dateLabel}</p>
                    </div>

                    {/* Mobile card */}
                    <div className="flex flex-col gap-3 px-4 py-4 md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <button 
                          type="button" 
                          onClick={() => setDetailOrder(order)} 
                          className="flex min-w-0 items-center gap-2.5 text-left"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{order.customer_name}</p>
                            <p className="truncate text-xs text-muted-foreground font-mono mt-0.5">{order.customer_phone}</p>
                          </div>
                        </button>
                        
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-foreground tabular-nums">
                            {order.total_amount.toLocaleString('fr-FR')}
                            <span className="ml-0.5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{order.currency}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 font-bold tabular-nums mt-0.5">{dateLabel}</p>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1.5 flex-wrap text-xs text-foreground bg-muted/20 border border-border/40 p-2.5 rounded-xl">
                        <span className="font-semibold">{order.product_name}</span>
                        {order.size && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{order.size}</Badge>}
                        {order.color && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{order.color}</Badge>}
                        <span className="text-muted-foreground">· Qté {order.quantity}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                        {category === 'to_validate' ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'shipped', payment_status: 'paid' })}
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 px-3 flex-1 justify-center shadow-sm"
                            >
                              <Check className="size-3.5 stroke-[2.5]" />
                              Valider
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'cancelled' })}
                              className="h-8 text-muted-foreground hover:text-destructive border-border rounded-lg flex items-center justify-center px-3"
                            >
                              <X className="size-3.5 stroke-[2.5] mr-1" />
                              Annuler
                            </Button>
                          </>
                        ) : category === 'validated' ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Check className="size-3 stroke-[2.5]" />
                              Validée
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, { shipping_status: 'pending', payment_status: 'pending' })}
                              className="h-8 text-xs text-muted-foreground flex items-center gap-1 px-2.5 rounded-lg"
                            >
                              <Clock className="size-3.5" />
                              Remettre en attente
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-[10px] font-bold text-destructive">
                              <X className="size-3 stroke-[2.5]" />
                              Annulée
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => updateOrderStatus(order.id, { shipping_status: 'pending' })}
                                className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
                                title="Remettre en attente"
                              >
                                <Clock className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOrder(order.id)}
                                className="size-8 text-muted-foreground hover:text-destructive rounded-lg"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="rounded-xl border-border bg-card hover:bg-muted/10 h-9 font-bold px-4">
            Charger plus ({filtered.length - visibleCount} restants)
          </Button>
        </div>
      )}

      <OrderDetailSheet order={detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  )
}

