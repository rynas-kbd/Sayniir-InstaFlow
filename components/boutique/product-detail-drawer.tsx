'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Send,
  Tag,
  ArrowRight,
  Boxes,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useT, useLocale } from '@/components/i18n-provider'
import { CopilotAvatar } from '@/components/ai/copilot-avatar'
import { PRODUCT_KIND_META } from './product-kinds'
import type { Product } from './types'

interface ProductDetailDrawerProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onToggleActive: (product: Product, nextActive: boolean) => void
}

export function ProductDetailDrawer({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleActive,
}: ProductDetailDrawerProps) {
  const t = useT()
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<'details' | 'bot_preview'>('details')

  if (!product) return null

  const isPhysical = product.kind === 'physical'
  const hasStock = (product.stock_quantity ?? 0) > 0
  const meta = PRODUCT_KIND_META[product.kind]
  const Icon = meta.icon

  const currencySymbol = product.currency?.toUpperCase() || 'EUR'
  const formattedPrice = product.price != null
    ? new Intl.NumberFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-US' : 'fr-FR', {
        style: 'currency',
        currency: currencySymbol,
      }).format(product.price)
    : '—'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-background border-s border-border/60 shadow-2xl"
      >
        {/* Header Cover Banner */}
        <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/40 overflow-hidden border-b border-border/40 shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex flex-col items-center justify-center gap-2 text-primary/70">
              <Icon className="size-12 stroke-[1.5]" />
              <span className="text-xs font-semibold text-muted-foreground">Aucune image d'illustration</span>
            </div>
          )}

          {/* Top overlays */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between z-10">
            <Badge className="rounded-full bg-background/90 text-foreground border border-border/60 backdrop-blur-md px-3 py-1 text-xs font-bold shadow-sm">
              <Icon className="size-3.5 me-1.5 text-primary" />
              {t(meta.label)}
            </Badge>

            <div className="flex items-center gap-2 rounded-full bg-background/90 border border-border/60 backdrop-blur-md px-3 py-1 shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                {product.is_active ? 'Actif' : 'Masqué'}
              </span>
              <Switch
                size="sm"
                checked={product.is_active}
                onCheckedChange={(next) => onToggleActive(product, next)}
              />
            </div>
          </div>
        </div>

        {/* Product Summary Header */}
        <div className="px-6 pt-4 pb-3 border-b border-border/40 shrink-0 bg-card/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-foreground line-clamp-1">
                {product.name}
              </h2>
              {product.category && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground mt-0.5">
                  <Tag className="size-3 text-primary" />
                  {product.category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-[var(--organic-terracotta)] tabular-nums">
                {formattedPrice}
              </div>
            </div>
          </div>

          {/* Tabs header */}
          <div className="flex items-center gap-2 mt-4 border-b border-border/40 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                'relative pb-2.5 text-xs font-bold transition-colors cursor-pointer',
                activeTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Fiche & Spécifications
              {activeTab === 'details' && (
                <motion.div
                  layoutId="drawerTabLine"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bot_preview')}
              className={cn(
                'relative pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                activeTab === 'bot_preview' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              Aperçu DM Copilote IA
              {activeTab === 'bot_preview' && (
                <motion.div
                  layoutId="drawerTabLine"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          </div>
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' ? (
            <>
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </h4>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 text-xs leading-relaxed text-foreground/90">
                  {product.description || <span className="italic text-muted-foreground/50">Aucune description renseignée.</span>}
                </div>
              </div>

              {/* Inventory & Stock details */}
              {isPhysical && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Boxes className="size-3.5 text-primary" />
                    Inventaire & Disponibilité
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/50 bg-card p-3.5 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Quantité disponible</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">{product.stock_quantity ?? 0}</span>
                        <span className="text-xs text-muted-foreground font-semibold">unités</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card p-3.5 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Statut du stock</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {hasStock ? (
                          <>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">En stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-4 text-destructive" />
                            <span className="text-xs font-bold text-destructive">En rupture</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants / Options */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  Tailles & Couleurs
                </h4>
                {((product.sizes?.length ?? 0) > 0 || (product.colors?.length ?? 0) > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {product.sizes?.map((size, idx) => (
                      <Badge key={`s-${idx}`} variant="secondary" className="px-3 py-1 text-xs font-semibold">
                        Taille : {size}
                      </Badge>
                    ))}
                    {product.colors?.map((color, idx) => (
                      <Badge key={`c-${idx}`} variant="outline" className="px-3 py-1 text-xs font-semibold">
                        Couleur : {color}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground/60">
                    Produit simple sans tailles ou couleurs particulières.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Bot DM Live Preview Tab */
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Sparkles className="size-4 text-amber-500" />
                  Simulation de recommandation automatique en DM
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Voici exactement comment Strobi présente ce produit lorsqu'un client demande des informations ou passe commande sur Instagram / WhatsApp :
                </p>

                {/* Simulated DM Bubble */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-lg space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-border/40 pb-2.5">
                    <CopilotAvatar size={28} animation="idle" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Strobi AI Assistant</span>
                      <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Réponse automatique Instagram
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-foreground">
                    "Absolument ! Voici les détails concernant <strong>{product.name}</strong> :
                    <br />
                    {product.description ? `\n« ${product.description} »` : ''}
                    <br />
                    <br />
                    💰 <strong>Prix :</strong> {formattedPrice}
                    {isPhysical && `\n📦 <strong>Stock :</strong> ${hasStock ? 'Disponible dès aujourd’hui' : 'Actuellement indisponible'}`}
                    <br />
                    Souhaitez-vous valider votre commande directement ici ?"
                  </p>

                  {/* Simulated Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="size-3.5" />
                        Commander maintenant ({formattedPrice})
                      </span>
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                    >
                      Poser une question à un conseiller
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/60 bg-card/60 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5 me-1.5" />
            Supprimer
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onEdit(product)
            }}
          >
            <Edit2 className="size-3.5 me-1.5" />
            Modifier le produit
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
