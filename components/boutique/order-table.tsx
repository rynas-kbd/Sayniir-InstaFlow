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
  pending:  { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  paid:     { label: 'Payé',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  failed:   { label: 'Échoué',    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
  refunded: { label: 'Remboursé', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' },
}

const SHIPPING_CONFIG: Record<ShippingStatus, { label: string; className: string }> = {
  pending:   { label: 'À expédier', className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700' },
  shipped:   { label: 'Expédié',    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' },
  delivered: { label: 'Livré',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  cancelled: { label: 'Annulé',    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
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
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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

          return (
            <div
              key={order.id}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Customer */}
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{order.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
                </div>
              </div>

              {/* Product */}
              <div className="min-w-0">
                <p className="truncate text-[13px] text-foreground">
                  {order.product_name}
                  {order.size && <span className="text-muted-foreground"> · {order.size}</span>}
                  {order.color && <span className="text-muted-foreground"> · {order.color}</span>}
                </p>
                <p className="text-xs text-muted-foreground">Qté {order.quantity}</p>
              </div>

              {/* Amount */}
              <p className="whitespace-nowrap text-sm font-bold text-foreground tabular-nums">
                {order.total_amount.toLocaleString('fr-FR')}
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">DZD</span>
              </p>

              {/* Payment Status */}
              <StatusSelect
                value={order.payment_status as PaymentStatus}
                options={PAYMENT_STATUSES}
                config={PAYMENT_CONFIG}
                onChange={(v) => updateStatus(order.id, 'payment_status', v)}
              />

              {/* Shipping Status */}
              <StatusSelect
                value={order.shipping_status as ShippingStatus}
                options={SHIPPING_STATUSES}
                config={SHIPPING_CONFIG}
                onChange={(v) => updateStatus(order.id, 'shipping_status', v)}
              />

              {/* Date */}
              <p className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
