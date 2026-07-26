import { Box, Clock, FileText, Repeat, Ticket } from 'lucide-react'
import type { ProductKind } from './types'

/** Single source of truth for per-kind display metadata — used by the grid card, the create/edit form's
 *  kind picker, and the live preview. Previously duplicated (with divergent label strings) between
 *  product-table.tsx and product-form-fields.tsx. */
export interface ProductKindMeta {
  key: ProductKind
  /** Compact — grid/preview card badge. */
  label: string
  /** Long — kind picker card title. */
  title: string
  /** One-liner shown under the picker title. */
  hint: string
  icon: React.ElementType
}

export const PRODUCT_KINDS: readonly ProductKindMeta[] = [
  { key: 'physical', label: 'Physique', title: 'Produit physique', hint: 'Stock, tailles, couleurs', icon: Box },
  { key: 'service', label: 'Service', title: 'Service / RDV', hint: 'Durée et lieu', icon: Clock },
  { key: 'digital', label: 'Digital', title: 'Produit digital', hint: 'Fichier téléchargeable', icon: FileText },
  { key: 'subscription', label: 'Abonnement', title: 'Abonnement', hint: 'Facturation récurrente', icon: Repeat },
  { key: 'event', label: 'Événement', title: 'Billet / événement', hint: 'Date et places', icon: Ticket },
] as const

export const PRODUCT_KIND_META: Record<ProductKind, ProductKindMeta> = Object.fromEntries(
  PRODUCT_KINDS.map((k) => [k.key, k]),
) as Record<ProductKind, ProductKindMeta>
