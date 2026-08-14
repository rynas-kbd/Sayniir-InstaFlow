'use client'

import { Eye } from 'lucide-react'
import { ProductCard } from '../product-card'
import { formToCardView } from '../product-card-view'
import { useT } from '@/components/i18n-provider'
import type { Product } from '../types'
import type { ProductFormState } from './types'

/** Sticky live preview of how the product will look in the boutique grid. Plain <div>, not
 * <Card> — Card carries `.glass-card`, and stacking it next to a form already inside a Card would
 * read as glass-on-glass; the real grid card is opaque `bg-card`, so an opaque preview mirrors it
 * more faithfully. No motion here — it re-renders on every keystroke, and any transition on a
 * live-typing surface reads as jitter rather than polish. */
export function ProductLivePreview({ form, product }: { form: ProductFormState; product?: Product }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 ps-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <Eye className="size-3" /> {t('boutique.productForm.livePreview.title')}
      </span>
      <ProductCard view={formToCardView(form, t, product)} placeholder />
      <p className="ps-1 text-[11px] leading-relaxed text-muted-foreground/70">{t('boutique.productForm.livePreview.description')}</p>
    </div>
  )
}
