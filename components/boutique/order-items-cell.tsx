'use client'

import { Badge } from '@/components/ui/badge'
import { useLocale, useT } from '@/components/i18n-provider'
import { computeOrderTotals } from '@/lib/boutique/order-total'
import type { Locale } from '@/lib/i18n/config'
import type { Order, OrderItem } from './types'

function toIntlLocale(locale: Locale): string {
  if (locale === 'ar') return 'ar'
  if (locale === 'en') return 'en-US'
  return 'fr-FR'
}

export function getOrderDisplayItems(order: Order): OrderItem[] {
  if (order.items && order.items.length > 0) {
    return [...order.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }
  return [
    {
      id: `${order.id}-legacy`,
      order_id: order.id,
      product_id: null,
      variant_id: null,
      product_name: order.product_name,
      size: order.size,
      color: order.color,
      quantity: order.quantity,
      unit_price: order.price,
      currency: order.currency,
      position: 0,
    },
  ]
}

function formatMoney(value: number, currency: string, locale: Locale): string {
  return `${value.toLocaleString(toIntlLocale(locale))} ${currency}`
}

function VariantBadges({ item }: { item: OrderItem }) {
  const t = useT()
  return (
    <div className="flex flex-wrap items-center gap-1">
      {item.size && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{item.size}</Badge>}
      {item.color && <Badge variant="outline" className="rounded-md border-border/60 bg-muted/40 px-1 py-0 text-[9px] font-bold uppercase">{item.color}</Badge>}
      <span className="text-xs text-muted-foreground/80 font-medium">{t('boutique.orderTable.qtyLabel', { count: item.quantity })}</span>
    </div>
  )
}

export function OrderItemsCell({ order, variant }: { order: Order; variant: 'compact' | 'detail' }) {
  const t = useT()
  const locale = useLocale()
  const items = getOrderDisplayItems(order)
  const first = items[0]
  const currency = first?.currency ?? order.currency
  const totals = computeOrderTotals(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price })),
    { percent_off: order.discount_percent_off, amount_off: order.discount_amount_off },
  )

  if (variant === 'compact') {
    return (
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-foreground">{first?.product_name ?? order.product_name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {first && <VariantBadges item={first} />}
          {items.length > 1 && (
            <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/10 px-1.5 py-0 text-[9px] font-bold text-primary">
              {t.plural('boutique.orderTable.items.moreCount', items.length - 1)}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 p-4 bg-card shadow-sm space-y-3">
      <div className="space-y-2">
        {items.map((item, index) => {
          const lineTotal = item.quantity * item.unit_price
          return (
            <div key={item.id ?? `${item.product_name}-${index}`} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm leading-snug">{item.product_name}</p>
                <div className="mt-1.5">
                  <VariantBadges item={item} />
                </div>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-[10px] text-muted-foreground">{formatMoney(item.unit_price, item.currency, locale)} / u.</p>
                <p className="font-black text-foreground text-sm tabular-nums">{formatMoney(lineTotal, item.currency, locale)}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="space-y-1 border-t border-border/50 pt-3 text-xs">
        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>{t('boutique.orderTable.detailSheet.subtotalLabel')}</span>
          <span className="tabular-nums">{formatMoney(totals.subtotal, currency, locale)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>{t('boutique.orderTable.detailSheet.discountLabel')}</span>
            <span className="tabular-nums">-{formatMoney(totals.discount, currency, locale)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3 text-sm font-black text-foreground">
          <span>{t('boutique.orderTable.detailSheet.totalLabel')}</span>
          <span className="tabular-nums">{formatMoney(order.total_amount, order.currency, locale)}</span>
        </div>
      </div>
    </div>
  )
}
