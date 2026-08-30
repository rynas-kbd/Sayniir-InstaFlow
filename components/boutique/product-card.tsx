'use client'

import { useState } from 'react'
import { Layers, Check, Eye, Edit2, Trash2, Sparkles, Boxes } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useT, useLocale } from '@/components/i18n-provider'
import type { Locale } from '@/lib/i18n/config'
import { PRODUCT_KIND_META } from './product-kinds'
import type { ProductCardView } from './product-card-view'

function toIntlLocale(locale: Locale): string {
  if (locale === 'ar') return 'ar'
  if (locale === 'en') return 'en-US'
  return 'fr-FR'
}

export interface ProductCardProps {
  view: ProductCardView
  actions?: React.ReactNode
  placeholder?: boolean
  className?: string
  onToggleActive?: (nextActive: boolean) => void
  selectable?: boolean
  selected?: boolean
  onToggleSelected?: () => void
  onInspect?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ProductCard({
  view,
  actions,
  placeholder,
  className,
  onToggleActive,
  selectable,
  selected,
  onToggleSelected,
  onInspect,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const t = useT()
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const [imgBroken, setImgBroken] = useState(false)

  const SelectionPill = selectable ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggleSelected?.()
      }}
      aria-pressed={selected}
      aria-label={
        selected
          ? t('boutique.productCard.deselectAria', { name: view.name })
          : t('boutique.productCard.selectAria', { name: view.name })
      }
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-150 cursor-pointer',
        selected
          ? 'border-primary bg-primary text-primary-foreground opacity-100'
          : 'border-border/60 bg-background/80 text-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:border-primary/50'
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
    </button>
  ) : null

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
      onClick={onInspect}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 ease-out cursor-pointer select-none',
        !placeholder && 'hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1',
        !view.isActive && 'opacity-65 grayscale-[0.1]',
        selected && 'border-primary/80 ring-2 ring-primary/20',
        className
      )}
    >
      {/* Top accent line */}
      {(!isPhysical || hasStock) && view.isActive && (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-gradient-to-r from-[var(--organic-terracotta)] via-[var(--organic-sage)] to-[var(--organic-terracotta)] opacity-80" />
      )}

      {/* ── Mobile Layout ── */}
      <div className="flex sm:hidden flex-col p-3.5 gap-2.5">
        <div className="flex items-start gap-3">
          {SelectionPill}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-inner">
            {renderCover()}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors">
              {view.name || (placeholder && <span className="italic text-muted-foreground/40">{t('boutique.productCard.namePlaceholder')}</span>)}
            </h3>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-sm font-black text-[var(--organic-terracotta)] tabular-nums">
                {view.price !== null ? view.price.toLocaleString(intlLocale) : '—'}{' '}
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase">{view.currency}</span>
              </span>

              {isPhysical && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide',
                    hasStock
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-destructive')} />
                  {hasStock ? `${view.stockQuantity}` : t('boutique.productCard.outOfStock')}
                </span>
              )}
            </div>
          </div>

          {onToggleActive && (
            <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
              <Switch
                size="sm"
                checked={view.isActive}
                onCheckedChange={onToggleActive}
                aria-label={view.isActive ? t('boutique.productCard.deactivateAria') : t('boutique.productCard.activateAria')}
              />
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* ── Desktop Layout ── */}
      <div className="hidden sm:flex flex-col h-full">
        {/* Cover Image */}
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl bg-muted/20 border-b border-border/40">
          {renderCover()}

          {/* Quick Hover Action Bar */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-end justify-between p-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onInspect?.()
              }}
              className="flex items-center gap-1.5 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="size-3.5" />
              Inspection IA
            </button>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-1.5 rounded-full bg-background/90 hover:bg-background text-foreground border border-border/60 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="size-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 rounded-full bg-background/90 hover:bg-destructive text-foreground hover:text-destructive-foreground border border-border/60 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Selection pill */}
          {selectable && <div className="absolute start-3 top-3 z-25">{SelectionPill}</div>}

          {/* Kind badge */}
          <div className="absolute start-3 bottom-3 z-15 group-hover:opacity-0 transition-opacity duration-200">
            <Badge className="rounded-full bg-background/90 text-foreground border border-border/50 px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm">
              {t(meta.label)}
            </Badge>
          </div>

          {/* Active/Inactive Switch overlay */}
          {onToggleActive && (
            <div className="absolute end-3 top-3 z-25" onClick={(e) => e.stopPropagation()}>
              <label className="flex items-center gap-2 rounded-full bg-background/80 hover:bg-background/95 transition-colors duration-200 border border-border/60 shadow-md backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-foreground select-none cursor-pointer">
                <span className={cn('transition-colors tracking-tight uppercase text-[9px]', view.isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {view.isActive ? t('boutique.productCard.statusActive') : t('boutique.productCard.statusHidden')}
                </span>
                <Switch
                  size="sm"
                  checked={view.isActive}
                  onCheckedChange={onToggleActive}
                  aria-label={view.isActive ? t('boutique.productCard.deactivateAria') : t('boutique.productCard.activateAria')}
                />
              </label>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col p-4 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary leading-snug">
              {view.name || (placeholder && <span className="italic text-muted-foreground/40">{t('boutique.productCard.namePlaceholder')}</span>)}
            </h3>

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
                {hasStock ? t('boutique.productCard.inStock', { count: view.stockQuantity }) : t('boutique.productCard.outOfStock')}
              </Badge>
            )}
          </div>

          {view.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground h-8">
              {view.description}
            </p>
          ) : (
            <div className="h-8 italic text-muted-foreground/30 text-xs">{t('boutique.productCard.noDescription')}</div>
          )}

          {/* Pricing & Options */}
          <div className="pt-1.5 flex items-baseline justify-between gap-2 mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-[var(--organic-terracotta)]">
                {view.price !== null ? view.price.toLocaleString(intlLocale) : '—'}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{view.currency}</span>
            </div>
          </div>

          {/* Options badges */}
          <div className="border-t border-border/40 pt-3 space-y-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
              <Layers className="size-3 text-muted-foreground/50" />
              {isPhysical ? t('boutique.productCard.optionsPhysical') : t('boutique.productCard.optionsOther')}
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
                <span className="text-[10px] font-bold italic text-muted-foreground/40 uppercase tracking-wide">{t('boutique.productCard.optionsEmpty')}</span>
              )}
            </div>
          </div>

          {actions && (
            <div className="mt-2 border-t border-border/40 pt-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
