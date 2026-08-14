import { Box, Clock, FileText, Repeat, Ticket } from 'lucide-react'
import type { ProductKind } from './types'

/** Single source of truth for per-kind display metadata — used by the grid card, the create/edit form's
 *  kind picker, and the live preview. Previously duplicated (with divergent label strings) between
 *  product-table.tsx and product-form-fields.tsx.
 *
 *  `label`/`title`/`hint` are i18n dot-path keys (not raw text) — this is a plain data module with
 *  no `'use client'`, so it can't call `useT()`/`getT()` itself. Callers resolve the text via
 *  `t(meta.label)` etc. (see boutique.productKinds.* in the dictionaries). */
export interface ProductKindMeta {
  key: ProductKind
  /** i18n key — compact grid/preview card badge. */
  label: string
  /** i18n key — kind picker card title. */
  title: string
  /** i18n key — one-liner shown under the picker title. */
  hint: string
  icon: React.ElementType
}

export const PRODUCT_KINDS: readonly ProductKindMeta[] = [
  { key: 'physical', label: 'boutique.productKinds.physical.label', title: 'boutique.productKinds.physical.title', hint: 'boutique.productKinds.physical.hint', icon: Box },
  { key: 'service', label: 'boutique.productKinds.service.label', title: 'boutique.productKinds.service.title', hint: 'boutique.productKinds.service.hint', icon: Clock },
  { key: 'digital', label: 'boutique.productKinds.digital.label', title: 'boutique.productKinds.digital.title', hint: 'boutique.productKinds.digital.hint', icon: FileText },
  { key: 'subscription', label: 'boutique.productKinds.subscription.label', title: 'boutique.productKinds.subscription.title', hint: 'boutique.productKinds.subscription.hint', icon: Repeat },
  { key: 'event', label: 'boutique.productKinds.event.label', title: 'boutique.productKinds.event.title', hint: 'boutique.productKinds.event.hint', icon: Ticket },
] as const

export const PRODUCT_KIND_META: Record<ProductKind, ProductKindMeta> = Object.fromEntries(
  PRODUCT_KINDS.map((k) => [k.key, k]),
) as Record<ProductKind, ProductKindMeta>
