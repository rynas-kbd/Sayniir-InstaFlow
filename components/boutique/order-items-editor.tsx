'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLocale, useT } from '@/components/i18n-provider'
import { computeOrderTotals } from '@/lib/boutique/order-total'
import type { Locale } from '@/lib/i18n/config'
import type { Order, Product } from './types'
import { getOrderDisplayItems } from './order-items-cell'
import { ProductPicker } from './product-picker'
import { buildOrderItemsPayload, hasOrderItemsErrors, validateOrderItems, type EditableOrderItem } from './order-items-schema'

function toIntlLocale(locale: Locale): string {
  if (locale === 'ar') return 'ar'
  if (locale === 'en') return 'en-US'
  return 'fr-FR'
}

function editableFromOrder(order: Order): EditableOrderItem[] {
  return getOrderDisplayItems(order).map((item, index) => ({
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    product_name: item.product_name,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    unit_price: item.unit_price,
    currency: item.currency,
    position: index,
  }))
}

export function OrderItemsEditor({
  order,
  products,
  onSaved,
}: {
  order: Order
  products: Product[]
  onSaved: (order: Order) => void
}) {
  const t = useT()
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const [lines, setLines] = useState<EditableOrderItem[]>(() => editableFromOrder(order))
  const [saving, setSaving] = useState(false)
  const totals = useMemo(
    () => computeOrderTotals(lines.map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })), {
      percent_off: order.discount_percent_off,
      amount_off: order.discount_amount_off,
    }),
    [lines, order.discount_amount_off, order.discount_percent_off],
  )

  function updateLine(index: number, patch: Partial<EditableOrderItem>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  async function save() {
    const payload = buildOrderItemsPayload(lines)
    const errors = validateOrderItems(payload, t)
    if (hasOrderItemsErrors(errors)) {
      toast.error(errors.root ?? t('boutique.orderTable.validation.generic'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      })
      if (!res.ok) throw new Error('update failed')
      onSaved(await res.json())
      toast.success(t('boutique.orderTable.toasts.itemsUpdateSuccess'))
    } catch {
      toast.error(t('boutique.orderTable.toasts.itemsUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">{t('boutique.orderTable.editor.title')}</p>
        <ProductPicker
          products={products}
          onPick={(product) => setLines((prev) => [
            ...prev,
            {
              product_id: product.id,
              variant_id: null,
              product_name: product.name,
              size: null,
              color: null,
              quantity: 1,
              unit_price: product.price,
              currency: product.currency,
              position: prev.length,
            },
          ])}
        />
      </div>

      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={`${line.product_id ?? line.product_name}-${index}`} className="rounded-lg border border-border/50 bg-card p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{line.product_name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {line.size && <Badge variant="outline" className="rounded-md px-1 py-0 text-[9px] font-bold uppercase">{line.size}</Badge>}
                  {line.color && <Badge variant="outline" className="rounded-md px-1 py-0 text-[9px] font-bold uppercase">{line.color}</Badge>}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                className="size-7 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                title={t('boutique.orderTable.editor.removeItem')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: Number.parseInt(e.target.value, 10) || 0 })}
                className="h-8 rounded-lg"
                aria-label={t('boutique.orderTable.editor.quantity')}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.unit_price}
                onChange={(e) => updateLine(index, { unit_price: Number.parseFloat(e.target.value) || 0 })}
                className="h-8 rounded-lg"
                aria-label={t('boutique.orderTable.editor.unitPrice')}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">{t('boutique.orderTable.editor.stockNotice')}</p>
      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <span className="text-xs font-bold text-muted-foreground">{t('boutique.orderTable.detailSheet.totalLabel')}</span>
        <span className="text-sm font-black tabular-nums">{totals.total.toLocaleString(intlLocale)} {order.currency}</span>
      </div>
      <Button type="button" onClick={save} disabled={saving} size="sm" className="h-8 w-full rounded-lg font-bold">
        {saving ? t('boutique.orderTable.editor.saving') : t('boutique.orderTable.editor.save')}
      </Button>
    </div>
  )
}
