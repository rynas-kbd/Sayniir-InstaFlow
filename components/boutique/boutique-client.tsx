'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ShoppingCart, Bot, Sparkles, Plug, Clock3, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductTable } from './product-table'
import { OrderTable } from './order-table'
import { AgentSettingsCard } from './agent-settings-card'
import { ShopifyIntegrationPanel } from './shopify-integration-panel'
import { BoutiqueStatsStrip, type BoutiqueStats } from './boutique-stats'
import { AbandonedSessionsList } from './abandoned-sessions-list'
import { DiscountCodesManager, type DiscountCode } from './discount-codes-manager'
import type { Product, Order, AgentSettings, AbandonedSession } from './types'

const TABS = [
  { key: 'products', label: 'Produits',   icon: Package },
  { key: 'orders',   label: 'Commandes',  icon: ShoppingCart },
  { key: 'abandoned', label: 'Paniers abandonnés', icon: Clock3 },
  { key: 'promos',   label: 'Codes promo', icon: Tag },
  { key: 'ai',       label: 'Config IA',  icon: Bot },
  { key: 'integrations', label: 'Intégrations', icon: Plug },
] as const

type TabKey = (typeof TABS)[number]['key']

export function BoutiqueClient({
  channelAccountId,
  products,
  orders,
  agentSettings,
  stats,
  abandonedSessions,
  discountCodes,
}: {
  channelAccountId: string
  products: Product[]
  orders: Order[]
  agentSettings: AgentSettings
  stats: BoutiqueStats
  abandonedSessions: AbandonedSession[]
  discountCodes: DiscountCode[]
}) {
  const [tab, setTab] = useState<TabKey>('products')

  const counts: Partial<Record<TabKey, number>> = {
    products: products.length,
    orders: orders.length,
    abandoned: abandonedSessions.length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero Banner with Organic Tokens ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--organic-terracotta) 0%, var(--organic-terracotta-600) 55%, var(--organic-sage-700) 100%)',
        }}
      >
        {/* Decorative ambient glowing circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-14 right-24 size-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-md border border-white/20">
                <Sparkles className="size-3 text-white" />
                Commerce IA Multi-canal
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">Boutique &amp; Catalogue</h2>
            <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-[50ch] leading-relaxed">
              Gérez votre catalogue de produits, vos commandes en temps réel et configurez l&apos;agent IA closer.
            </p>
          </div>

          {/* Stats pills */}
          <div className="hidden sm:flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2 border border-white/20 backdrop-blur-md shadow-sm">
              <Package className="size-4 text-white" />
              <span className="text-sm font-extrabold">{products.length}</span>
              <span className="text-xs text-white/80 font-medium">produits</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2 border border-white/20 backdrop-blur-md shadow-sm">
              <ShoppingCart className="size-4 text-white" />
              <span className="text-sm font-extrabold">{orders.length}</span>
              <span className="text-xs text-white/80 font-medium">commandes</span>
            </div>
          </div>
        </div>
      </div>

      <BoutiqueStatsStrip stats={stats} />

      {/* ── Tab Navigation ── */}
      <div>
        <div className="relative flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-muted/30 p-1.5 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key
            const count = counts[key]
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'relative z-10 flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-1 cursor-pointer select-none',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBoutiqueTab"
                    className="absolute inset-0 z-0 rounded-xl bg-card shadow-md border border-border/60"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={cn('relative z-10 size-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="relative z-10 text-[12px] sm:text-sm">{label}</span>
                {count !== undefined && (
                  <span
                    className={cn(
                      'relative z-10 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition-colors',
                      isActive
                        ? 'bg-primary/12 text-primary border border-primary/20'
                        : 'bg-muted/80 text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab Content with AnimatePresence ── */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === 'products' && (
                <ProductTable channelAccountId={channelAccountId} initialProducts={products} />
              )}
              {tab === 'orders' && (
                <OrderTable initialOrders={orders} />
              )}
              {tab === 'abandoned' && (
                <div className="pt-2">
                  <AbandonedSessionsList sessions={abandonedSessions} />
                </div>
              )}
              {tab === 'promos' && (
                <DiscountCodesManager channelAccountId={channelAccountId} initialCodes={discountCodes} />
              )}
              {tab === 'ai' && (
                <AgentSettingsCard channelAccountId={channelAccountId} initialSettings={agentSettings} />
              )}
              {tab === 'integrations' && <ShopifyIntegrationPanel channelAccountId={channelAccountId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
