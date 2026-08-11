'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ShoppingCart, MapPin, CreditCard, Package, Calendar, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { Order } from './types'

const PAGE_SIZE = 25
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
const SHIPPING_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'] as const

type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
type ShippingStatus = (typeof SHIPPING_STATUSES)[number]

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending:  { label: 'En attente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  paid:     { label: 'Payé',       className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  failed:   { label: 'Échoué',    className: 'bg-destructive/10 text-destructive border-destructive/20' },
  refunded: { label: 'Remboursé', className: 'bg-[var(--organic-sage-100)] text-[var(--organic-sage-800)] border-[var(--organic-sage-300)]' },
}

const SHIPPING_CONFIG: Record<ShippingStatus, { label: string; className: string }> = {
  pending:   { label: 'À expédier', className: 'bg-muted text-muted-foreground border-border' },
  shipped:   { label: 'Expédié',    className: 'bg-[var(--organic-terracotta-100)] text-[var(--organic-terracotta-800)] border-[var(--organic-terracotta-300)]' },
  delivered: { label: 'Livré',      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Annulé',    className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

function StatusSelect<T extends string>({
  value,
  options,
  config,
  onChange,
}: {
  value: T
  options: readonly T[]
  config: Record<T, { label: string; className: string }>
  onChange: (v: T) => void
}) {
  const current = config[value]
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-7 w-auto gap-1.5 border-0 bg-transparent p-0 text-xs font-medium shadow-none focus:ring-0">
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', current.className)}>
          {current.label}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', config[s].className)}>
              {config[s].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function OrderDetailSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Sheet open={order !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Commande de {order?.customer_name}</SheetTitle>
        </SheetHeader>
        {order && (
          <div className="space-y-4 px-4 pb-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
              <p className="mt-1 font-medium text-foreground">{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_phone}</p>
              {order.contact && (order.contact.username || order.contact.full_name) && (
                <p className="text-muted-foreground">
                  Lié au contact CRM : {order.contact.username ? `@${order.contact.username}` : order.contact.full_name}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produit</p>
              <p className="mt-1 text-foreground">
                {order.product_name}
                {order.size && ` · ${order.size}`}
                {order.color && ` · ${order.color}`} · Qté {order.quantity}
              </p>
              <p className="font-bold text-foreground">{order.total_amount.toLocaleString('fr-FR')} {order.currency}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Livraison</p>
              <p className="mt-1 text-foreground">{order.wilaya ?? '—'}{order.delivery_mode ? ` · ${order.delivery_mode}` : ''}</p>
              {order.shipping_address && <p className="text-muted-foreground">{order.shipping_address}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
              <p className="mt-1 text-foreground">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
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
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  async function updateStatus(id: string, field: 'payment_status' | 'shipping_status', value: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Erreur')
      const updated: Order = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      toast.success('Commande mise à jour')
    } catch {
      toast.error('Impossible de mettre à jour la commande')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null
    return orders.filter((o) => {
      if (q && !`${o.customer_name} ${o.customer_phone} ${o.product_name}`.toLowerCase().includes(q)) return false
      if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false
      const created = new Date(o.created_at).getTime()
      if (from !== null && created < from) return false
      if (to !== null && created > to) return false
      return true
    })
  }, [orders, search, paymentFilter, dateFrom, dateTo])

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
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
            placeholder="Rechercher client, téléphone, produit…"
            className="pl-8"
          />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v as typeof paymentFilter); setVisibleCount(PAGE_SIZE) }}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Paiement" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PAYMENT_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-full sm:w-[150px]" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-full sm:w-[150px]" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Aucune commande ne correspond à ces filtres." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header — desktop only */}
          <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:grid">
            <span className="flex items-center gap-1.5"><Package className="size-3" /> Client</span>
            <span>Produit</span>
            <span>Total</span>
            <span className="flex items-center gap-1.5"><CreditCard className="size-3" /> Paiement</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-3" /> Livraison</span>
            <span className="flex items-center gap-1.5"><Calendar className="size-3" /> Date</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/60">
            {visible.map((order) => {
              const initials = order.customer_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              const dateLabel = new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

              return (
                <div key={order.id}>
                  {/* Desktop row */}
                  <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-muted/30 md:grid">
                    <button
                      type="button"
                      onClick={() => setDetailOrder(order)}
                      className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">{order.customer_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customer_phone}
                          {order.contact && (order.contact.username || order.contact.full_name) && (
                            <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground/80">
                              {order.contact.username ? `@${order.contact.username}` : order.contact.full_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>

                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-foreground">
                        {order.product_name}
                        {order.size && <span className="text-muted-foreground"> · {order.size}</span>}
                        {order.color && <span className="text-muted-foreground"> · {order.color}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Qté {order.quantity}</p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-bold text-foreground tabular-nums">
                      {order.total_amount.toLocaleString('fr-FR')}
                      <span className="ml-0.5 text-xs font-medium text-muted-foreground">{order.currency}</span>
                    </p>

                    <StatusSelect
                      value={order.payment_status as PaymentStatus}
                      options={PAYMENT_STATUSES}
                      config={PAYMENT_CONFIG}
                      onChange={(v) => updateStatus(order.id, 'payment_status', v)}
                    />

                    <StatusSelect
                      value={order.shipping_status as ShippingStatus}
                      options={SHIPPING_STATUSES}
                      config={SHIPPING_CONFIG}
                      onChange={(v) => updateStatus(order.id, 'shipping_status', v)}
                    />

                    <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{dateLabel}</p>
                  </div>

                  {/* Mobile card */}
                  <div className="flex flex-col gap-3 px-4 py-3.5 md:hidden">
                    <button type="button" onClick={() => setDetailOrder(order)} className="flex items-start justify-between gap-3 text-left">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{order.customer_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-sm font-bold text-foreground tabular-nums">
                        {order.total_amount.toLocaleString('fr-FR')}
                        <span className="ml-0.5 text-xs font-medium text-muted-foreground">{order.currency}</span>
                      </p>
                    </button>

                    <p className="text-sm text-foreground">
                      {order.product_name}
                      {order.size && <span className="text-muted-foreground"> · {order.size}</span>}
                      {order.color && <span className="text-muted-foreground"> · {order.color}</span>}
                      <span className="text-muted-foreground"> · Qté {order.quantity}</span>
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusSelect
                          value={order.payment_status as PaymentStatus}
                          options={PAYMENT_STATUSES}
                          config={PAYMENT_CONFIG}
                          onChange={(v) => updateStatus(order.id, 'payment_status', v)}
                        />
                        <StatusSelect
                          value={order.shipping_status as ShippingStatus}
                          options={SHIPPING_STATUSES}
                          config={SHIPPING_CONFIG}
                          onChange={(v) => updateStatus(order.id, 'shipping_status', v)}
                        />
                      </div>
                      <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{dateLabel}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Charger plus ({filtered.length - visibleCount} restants)
          </Button>
        </div>
      )}

      <OrderDetailSheet order={detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  )
}
