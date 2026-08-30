'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Edit2,
  Trash2,
  Eye,
  Check,
  Minus,
  CheckCircle2,
  XCircle,
  Tag,
  Boxes,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useT, useLocale } from '@/components/i18n-provider'
import { PRODUCT_KIND_META } from './product-kinds'
import type { Product } from './types'

interface ProductDenseTableProps {
  products: Product[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  allSelected: boolean
  someSelected: boolean
  onInspect: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onToggleActive: (product: Product, nextActive: boolean) => void
}

export function ProductDenseTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  onInspect,
  onEdit,
  onDelete,
  onToggleActive,
}: ProductDenseTableProps) {
  const t = useT()
  const locale = useLocale()

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 font-extrabold uppercase tracking-wider text-muted-foreground">
              <th className="p-3 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="flex size-4 items-center justify-center rounded border border-input"
                >
                  {allSelected ? (
                    <Check className="size-3 text-primary" strokeWidth={3} />
                  ) : someSelected ? (
                    <Minus className="size-3 text-primary" strokeWidth={3} />
                  ) : null}
                </button>
              </th>
              <th className="p-3">Produit</th>
              <th className="p-3">Type</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3 text-right">Prix</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Statut</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {products.map((product) => {
              const isSelected = selectedIds.has(product.id)
              const meta = PRODUCT_KIND_META[product.kind]
              const Icon = meta.icon
              const isPhysical = product.kind === 'physical'
              const hasStock = (product.stock_quantity ?? 0) > 0

              const currencySymbol = product.currency?.toUpperCase() || 'EUR'
              const formattedPrice = product.price != null
                ? new Intl.NumberFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-US' : 'fr-FR', {
                    style: 'currency',
                    currency: currencySymbol,
                  }).format(product.price)
                : '—'

              return (
                <tr
                  key={product.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    isSelected && 'bg-primary/5',
                    !product.is_active && 'opacity-60'
                  )}
                >
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(product.id)}
                      className={cn(
                        'flex size-4 items-center justify-center rounded border transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                      )}
                    >
                      {isSelected && <Check className="size-3" strokeWidth={3} />}
                    </button>
                  </td>

                  {/* Image & Title */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-primary/60">
                            <Icon className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onInspect(product)}
                          className="font-bold text-foreground hover:text-primary transition-colors text-start line-clamp-1 cursor-pointer"
                        >
                          {product.name}
                        </button>
                        {product.description && (
                          <span className="text-[11px] text-muted-foreground line-clamp-1">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kind */}
                  <td className="p-3">
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                      <Icon className="size-3 me-1 text-primary" />
                      {t(meta.label)}
                    </Badge>
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    {product.category ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Tag className="size-3 text-primary/70" />
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 italic">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="p-3 text-right font-black text-foreground tabular-nums text-sm">
                    {formattedPrice}
                  </td>

                  {/* Stock */}
                  <td className="p-3 text-center">
                    {isPhysical ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                          hasStock
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-destructive')} />
                        {product.stock_quantity ?? 0}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 italic">—</span>
                    )}
                  </td>

                  {/* Active Switch */}
                  <td className="p-3 text-center">
                    <Switch
                      size="sm"
                      checked={product.is_active}
                      onCheckedChange={(next) => onToggleActive(product, next)}
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onInspect(product)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                        title="Inspecter le produit"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
