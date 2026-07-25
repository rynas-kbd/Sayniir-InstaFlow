'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShoppingCart, MapPin, CreditCard, Package, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Order } from './types'

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
const SHIPPING_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'] as const

type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
type ShippingStatus = (typeof SHIPPING_STATUSES)[number]

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending:  { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/20' },
  paid:     { label: 'Payé',       className: 'bg-success/10 text-success border-success/20' },
  failed:   { label: 'Échoué',    className: 'bg-destructive/10 text-destructive border-destructive/20' },
  refunded: { label: 'Remboursé', className: 'bg-sage-100 text-sage-700 border-sage-200' },
}

const SHIPPING_CONFIG: Record<ShippingStatus, { label: string; className: string }> = {
  pending:   { label: 'À expédier', className: 'bg-muted text-muted-foreground border-border' },
  shipped:   { label: 'Expédié',    className: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200' },
  delivered: { label: 'Livré',      className: 'bg-success/10 text-success border-success/20' },
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

export function OrderTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)

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

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Aucune commande"
        description="Les commandes générées par l'IA apparaîtront ici."
      />
    )
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
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
        {orders.map((order) => {
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
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{order.customer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
                  </div>
                </div>

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
                  <span className="ml-0.5 text-xs font-medium text-muted-foreground">DZD</span>
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
                <div className="flex items-start justify-between gap-3">
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
                    <span className="ml-0.5 text-xs font-medium text-muted-foreground">DZD</span>
                  </p>
                </div>

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
  )
}
