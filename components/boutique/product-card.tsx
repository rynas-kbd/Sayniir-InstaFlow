'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PRODUCT_KIND_META } from './product-kinds'
import type { ProductCardView } from './product-card-view'

export interface ProductCardProps {
  view: ProductCardView
  actions?: React.ReactNode
  placeholder?: boolean
  className?: string
  onToggleActive?: (nextActive: boolean) => void
}

export function ProductCard({ view, actions, placeholder, className, onToggleActive }: ProductCardProps) {
  const [imgBroken, setImgBroken] = useState(false)
  const isPhysical = view.kind === 'physical'
  const hasStock = view.stockQuantity > 0
  const meta = PRODUCT_KIND_META[view.kind]
  const Icon = meta.icon

  const renderCover = () => {
    if (!view.imageUrl || imgBroken) {
      return (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-[var(--organic-sage-100)] text-primary/60 dark:text-primary/85">
          <Icon className="size-10 stroke-[1.5] transition-transform duration-500 ease-out group-hover:scale-110" />
        </div>
      )
    }
    return (
      <img
        src={view.imageUrl}
        alt={view.name}
        onError={() => setImgBroken(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    )
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 ease-out',
        !placeholder && 'hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
        !view.isActive && 'opacity-65 grayscale-[0.1]',
        className,
      )}
    >
      {/* Top accent line */}
      {(!isPhysical || hasStock) && view.isActive && (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-gradient-to-r from-[var(--organic-terracotta)] via-[var(--organic-sage)] to-[var(--organic-terracotta)] opacity-80" />
      )}

      {/* ── Mobile Layout (Horizontal compact row) ── */}
      <div className="flex sm:hidden items-center gap-3.5 p-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-inner">
          {renderCover()}
        </div>
        
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/40 px-2 py-0 text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider">
              {meta.label}
            </Badge>
            {isPhysical && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide',
                hasStock 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-destructive/10 text-destructive'
              )}>
                <span className={cn('size-1 rounded-full', hasStock ? 'bg-emerald-500' : 'bg-destructive')} />
                {hasStock ? `${view.stockQuantity}` : 'Rupture'}
              </span>
            )}
          </div>
          
          <h3 className="line-clamp-1 text-sm font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {view.name || (placeholder && <span className="italic text-muted-foreground/40">Nom du produit</span>)}
          </h3>
          
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-[var(--organic-terracotta)] tabular-nums">
              {view.price !== null ? view.price.toLocaleString('fr-FR') : '—'}
            </span>
            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">{view.currency}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {onToggleActive && (
            <label style={{ minHeight: '36px', minWidth: '36px' }} className="flex items-center justify-center cursor-pointer select-none">
              <Switch size="sm" checked={view.isActive} onCheckedChange={onToggleActive} aria-label={view.isActive ? 'Désactiver' : 'Activer'} />
            </label>
          )}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      </div>

      {/* ── Desktop Layout (Vertical card) ── */}
      <div className="hidden sm:flex flex-col h-full">
        {/* Card Cover Image Header */}
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl bg-muted/20 border-b border-border/40">
          {renderCover()}
          
          {/* Badge kind overlay */}
          <div className="absolute left-3 bottom-3 z-15">
            <Badge className="rounded-full bg-background/90 text-foreground border border-border/50 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm">
              {meta.label}
            </Badge>
          </div>

          {/* Active/Inactive Switch overlay */}
          {onToggleActive && (
            <div className="absolute right-3 top-3 z-15">
              <label className="flex items-center gap-2 rounded-full bg-background/80 hover:bg-background/95 transition-colors duration-200 border border-border/60 shadow-md backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-foreground select-none cursor-pointer">
                <span className={cn('transition-colors tracking-tight uppercase text-[9px]', view.isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {view.isActive ? 'Actif' : 'Masqué'}
                </span>
                <Switch size="sm" checked={view.isActive} onCheckedChange={onToggleActive} aria-label={view.isActive ? 'Désactiver' : 'Activer'} />
              </label>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col p-4 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary leading-snug">
              {view.name || (placeholder && <span className="italic text-muted-foreground/40">Nom du produit</span>)}
            </h3>
            
            {/* Availability Badges */}
            {isPhysical && (
              <Badge
                variant={hasStock ? 'secondary' : 'destructive'}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all duration-300',
                  hasStock 
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                )}
              >
                <span className={cn('size-1.5 rounded-full', hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-destructive')} />
                {hasStock ? `${view.stockQuantity} en stock` : 'Rupture'}
              </Badge>
            )}
          </div>

          {view.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground h-8">
              {view.description}
            </p>
          ) : (
            <div className="h-8 italic text-muted-foreground/30 text-xs">Aucune description fournie.</div>
          )}

          {/* Pricing & Options */}
          <div className="pt-1.5 flex items-baseline justify-between gap-2 mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-[var(--organic-terracotta)]">
                {view.price !== null ? view.price.toLocaleString('fr-FR') : '—'}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{view.currency}</span>
            </div>
          </div>

          {/* Options badges */}
          <div className="border-t border-border/40 pt-3 space-y-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
              <Layers className="size-3 text-muted-foreground/50" /> 
              {isPhysical ? 'Variantes & Tailles' : 'Spécifications'}
            </span>
            
            <div className="flex min-h-[24px] flex-wrap gap-1">
              {view.optionBadges.length > 0 ? (
                <>
                  {view.optionBadges.slice(0, 3).map((variant, i) => (
                    <Badge key={i} variant="outline" className="rounded-md border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-foreground/80">
                      {variant}
                    </Badge>
                  ))}
                  {view.optionBadges.length > 3 && (
                    <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-extrabold text-primary">
                      +{view.optionBadges.length - 3}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-[10px] font-bold italic text-muted-foreground/40 uppercase tracking-wide">— Produit unique</span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          {actions && (
            <div className="mt-2 border-t border-border/40 pt-3 flex items-center justify-end gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
