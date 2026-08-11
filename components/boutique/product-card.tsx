'use client'

import { useRef } from 'react'
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PRODUCT_KIND_META } from './product-kinds'
import { ProductThumb } from './product-thumb'
import type { ProductCardView } from './product-card-view'

export interface ProductCardProps {
  view: ProductCardView
  actions?: React.ReactNode
  placeholder?: boolean
  className?: string
  onToggleActive?: (nextActive: boolean) => void
}

export function ProductCard({ view, actions, placeholder, className, onToggleActive }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isPhysical = view.kind === 'physical'
  const hasStock = view.stockQuantity > 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (placeholder || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -6
    cardRef.current.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`
  }

  const handleMouseLeave = () => {
    if (placeholder || !cardRef.current) return
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-300 ease-out',
        !placeholder && 'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5',
        !view.isActive && 'opacity-60 grayscale-[0.15]',
        className,
      )}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {/* Top ambient glowing line */}
      {(!isPhysical || hasStock) && view.isActive && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--organic-terracotta)] via-[var(--organic-sage)] to-[var(--organic-terracotta)] opacity-85" />
      )}

      <ProductCardHeader view={view} isPhysical={isPhysical} hasStock={hasStock} onToggleActive={onToggleActive} />
      <ProductCardBody view={view} placeholder={placeholder} />
      <ProductCardOptions view={view} isPhysical={isPhysical} />

      {actions && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
          {actions}
        </div>
      )}
    </div>
  )
}

function ProductCardHeader({
  view,
  isPhysical,
  hasStock,
  onToggleActive,
}: {
  view: ProductCardView
  isPhysical: boolean
  hasStock: boolean
  onToggleActive?: (nextActive: boolean) => void
}) {
  const meta = PRODUCT_KIND_META[view.kind]
  return (
    <div className="mb-3.5 flex items-start justify-between gap-3">
      <ProductThumb src={view.imageUrl} kind={view.kind} />
      <div className="flex flex-col items-end gap-1.5">
        {onToggleActive && (
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground select-none cursor-pointer">
            <span className={cn('transition-colors', view.isActive ? 'text-primary font-bold' : 'text-muted-foreground')}>
              {view.isActive ? 'Actif' : 'Masqué'}
            </span>
            <Switch
              size="sm"
              checked={view.isActive}
              onCheckedChange={onToggleActive}
              aria-label={view.isActive ? 'Désactiver le produit' : 'Activer le produit'}
            />
          </label>
        )}
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="rounded-full border-border/80 bg-muted/30 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {meta.label}
          </Badge>
          {isPhysical && (
            <Badge
              variant={hasStock ? 'secondary' : 'destructive'}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all',
                hasStock
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              <span className={cn('size-1.5 rounded-full', hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-destructive')} />
              {hasStock ? `${view.stockQuantity} en stock` : 'Rupture'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCardBody({ view, placeholder }: { view: ProductCardView; placeholder?: boolean }) {
  return (
    <div className="flex min-h-[64px] flex-1 flex-col gap-1.5">
      <h3 className="line-clamp-1 text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
        {view.name || (placeholder && <span className="italic text-muted-foreground/50">Nom du produit</span>)}
      </h3>
      {view.description && (
        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{view.description}</p>
      )}
      <div className="mt-auto pt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-black tracking-tight text-[var(--organic-terracotta)] dark:text-[var(--organic-terracotta)]">
          {view.price !== null ? view.price.toLocaleString('fr-FR') : '—'}
        </span>
        <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">{view.currency}</span>
      </div>
    </div>
  )
}

function ProductCardOptions({ view, isPhysical }: { view: ProductCardView; isPhysical: boolean }) {
  return (
    <div className="mt-3.5 flex flex-col justify-end gap-1.5 border-t border-border/40 pt-3">
      <span className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <Layers className="size-3 text-muted-foreground/60" /> {isPhysical ? 'Variantes & Tailles' : 'Spécifications'}
      </span>
      <div className="mt-0.5 flex min-h-[24px] flex-wrap gap-1">
        {view.optionBadges.length > 0 ? (
          <>
            {view.optionBadges.slice(0, 4).map((variant, i) => (
              <Badge key={i} variant="outline" className="rounded-md border-border/70 bg-muted/40 px-2 py-0.5 text-[10.5px] font-semibold text-foreground/80">
                {variant}
              </Badge>
            ))}
            {view.optionBadges.length > 4 && (
              <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-bold text-primary">
                +{view.optionBadges.length - 4}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-[11px] font-medium italic text-muted-foreground/60">— Produit unique</span>
        )}
      </div>
    </div>
  )
}
