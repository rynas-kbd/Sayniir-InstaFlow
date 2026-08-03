import { Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PRODUCT_KIND_META } from './product-kinds'
import { ProductThumb } from './product-thumb'
import type { ProductCardView } from './product-card-view'

export interface ProductCardProps {
  view: ProductCardView
  /** Bottom action row. Omitted → no row rendered (live-preview mode). */
  actions?: React.ReactNode
  /** Muted placeholders instead of empty values, no hover lift. Used by the live preview. */
  placeholder?: boolean
  className?: string
  /** Omitted → no toggle rendered (live-preview mode has nothing to persist). */
  onToggleActive?: (nextActive: boolean) => void
}

/** Presentational product card — shared by the boutique grid (product-table.tsx) and the
 * create/edit form's live preview, so the two can never visually diverge. Markup below mirrors
 * the original product-table.tsx card verbatim so the grid stays pixel-identical after the swap. */
export function ProductCard({ view, actions, placeholder, className, onToggleActive }: ProductCardProps) {
  const isPhysical = view.kind === 'physical'
  const hasStock = view.stockQuantity > 0

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300',
        !placeholder && 'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
        !view.isActive && 'opacity-60',
        className,
      )}
    >
      {(!isPhysical || hasStock) && view.isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-success/50 via-success to-success/50" />
      )}

      <ProductCardHeader view={view} isPhysical={isPhysical} hasStock={hasStock} onToggleActive={onToggleActive} />
      <ProductCardBody view={view} placeholder={placeholder} />
      <ProductCardOptions view={view} isPhysical={isPhysical} />

      {actions && <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/30 pt-3">{actions}</div>}
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
    <div className="mb-3 flex items-start justify-between gap-3">
      <ProductThumb src={view.imageUrl} kind={view.kind} />
      <div className="flex flex-col items-end gap-1.5">
        {onToggleActive && (
          <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            {view.isActive ? 'Actif' : 'Inactif'}
            <Switch
              size="sm"
              checked={view.isActive}
              onCheckedChange={onToggleActive}
              aria-label={view.isActive ? 'Désactiver le produit' : 'Activer le produit'}
            />
          </label>
        )}
        <Badge variant="outline" className="rounded-full border-border/80 bg-muted/20 px-3 py-0.5 text-[10px] font-bold text-muted-foreground">
          {meta.label}
        </Badge>
        {isPhysical && (
          <Badge
            variant={hasStock ? 'secondary' : 'destructive'}
            className={cn(
              'rounded-full border px-3 py-0.5 text-[10px] font-bold transition-all',
              hasStock ? 'border-success/15 bg-success/8 text-success' : 'border-destructive/15 bg-destructive/8 text-destructive',
            )}
          >
            {hasStock ? `${view.stockQuantity} en stock` : 'Rupture'}
          </Badge>
        )}
      </div>
    </div>
  )
}

function ProductCardBody({ view, placeholder }: { view: ProductCardView; placeholder?: boolean }) {
  return (
    <div className="flex min-h-[60px] flex-1 flex-col gap-1.5">
      <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
        {view.name || (placeholder && <span className="italic text-muted-foreground/50">Nom du produit</span>)}
      </h3>
      {view.description && <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{view.description}</p>}
      <p className="mt-auto pt-1 text-[15px] font-extrabold tracking-tight text-[var(--organic-terracotta-700)] dark:text-[var(--organic-terracotta-600)]">
        {view.price !== null ? view.price.toLocaleString('fr-FR') : '—'} {view.currency}
      </p>
    </div>
  )
}

function ProductCardOptions({ view, isPhysical }: { view: ProductCardView; isPhysical: boolean }) {
  return (
    <div className="mt-4 flex flex-col justify-end gap-1.5 border-t border-border/30 pt-3">
      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75">
        <Layers className="size-3" /> {isPhysical ? 'Options' : 'Détails'}
      </span>
      <div className="mt-1 flex min-h-[22px] flex-wrap gap-1">
        {view.optionBadges.length > 0 ? (
          <>
            {view.optionBadges.slice(0, 4).map((variant, i) => (
              <Badge key={i} variant="outline" className="rounded-md border-border/80 bg-muted/10 px-2 py-0 text-[10px] font-medium text-muted-foreground/90">
                {variant}
              </Badge>
            ))}
            {view.optionBadges.length > 4 && (
              <Badge variant="outline" className="rounded-md border-border/80 bg-muted/10 px-1.5 py-0 text-[10px] font-medium text-muted-foreground/80">
                +{view.optionBadges.length - 4}
              </Badge>
            )}
          </>
        ) : (
          <span className="pl-1 text-[11px] italic text-muted-foreground/50">— Standard</span>
        )}
      </div>
    </div>
  )
}
