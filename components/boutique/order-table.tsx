'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { Order } from './types'

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
const SHIPPING_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled']

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
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paiement</TableHead>
            <TableHead>Livraison</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">{order.customer_name}</div>
                <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
              </TableCell>
              <TableCell>
                {order.product_name}
                {order.size && ` · ${order.size}`}
                {order.color && ` · ${order.color}`}
                <div className="text-xs text-muted-foreground">Qté {order.quantity}</div>
              </TableCell>
              <TableCell className="font-medium">{order.total_amount.toLocaleString('fr-FR')} DZD</TableCell>
              <TableCell>
                <Select value={order.payment_status} onValueChange={(v) => v && updateStatus(order.id, 'payment_status', v)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={order.shipping_status} onValueChange={(v) => v && updateStatus(order.id, 'shipping_status', v)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
