'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ShoppingCart, Bot, Sparkles, Plug, Clock3, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { ProductTable } from './product-table'
import { OrderTable } from './order-table'
import { AgentSettingsCard } from './agent-settings-card'
import { ShopifyIntegrationPanel } from './shopify-integration-panel'
import { BoutiqueStatsStrip, type BoutiqueStats } from './boutique-stats'
import { AbandonedSessionsList } from './abandoned-sessions-list'
import { DiscountCodesManager, type DiscountCode } from './discount-codes-manager'
import type { Product, Order, AgentSettings, AbandonedSession } from './types'

const TAB_KEYS = [
  { key: 'products', labelKey: 'products', icon: Package },
  { key: 'orders', labelKey: 'orders', icon: ShoppingCart },
  { key: 'abandoned', labelKey: 'abandoned', icon: Clock3 },
  { key: 'promos', labelKey: 'promos', icon: Tag },
  { key: 'ai', labelKey: 'ai', icon: Bot },
  { key: 'integrations', labelKey: 'integrations', icon: Plug },
] as const

type TabKey = (typeof TAB_KEYS)[number]['key']

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
  const t = useT()
  const [tab, setTab] = useState<TabKey>('products')
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null)

  const counts: Partial<Record<TabKey, number>> = {
    products: products.length,
    orders: orders.length,
    abandoned: abandonedSessions.length,
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-4 py-5 sm:px-6 sm:py-7 text-white shadow-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--organic-terracotta) 0%, var(--organic-terracotta-600) 55%, var(--organic-sage-700) 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-14 right-24 size-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-md border border-white/20">
                <Sparkles className="size-3 text-white" />
                {t('boutique.client.heroBadge')}
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {t('boutique.client.heroTitle')}
            </h2>
            <p className="mt-1 text-[11px] sm:text-sm text-white/80 max-w-[50ch] leading-relaxed hidden sm:block">
              {t('boutique.client.heroDescription')}
            </p>
          </div>

          {/* Stats pills — hidden on mobile, visible on sm+ */}
          <div className="hidden sm:flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2 border border-white/20 backdrop-blur-md shadow-sm">
              <Package className="size-4 text-white" />
              <span className="text-sm font-extrabold">{products.length}</span>
              <span className="text-xs text-white/80 font-medium">{t('boutique.client.heroProductsLabel')}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/15 px-4 py-2 border border-white/20 backdrop-blur-md shadow-sm">
              <ShoppingCart className="size-4 text-white" />
              <span className="text-sm font-extrabold">{orders.length}</span>
              <span className="text-xs text-white/80 font-medium">{t('boutique.client.heroOrdersLabel')}</span>
            </div>
          </div>

          {/* Compact stats on mobile only */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <div className="flex flex-col items-center rounded-xl bg-white/15 px-3 py-2 border border-white/20 backdrop-blur-md">
              <span className="text-base font-black leading-none">{products.length}</span>
              <span className="text-[9px] text-white/70 font-semibold mt-0.5">{t('boutique.client.heroProductsLabel')}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/15 px-3 py-2 border border-white/20 backdrop-blur-md">
              <span className="text-base font-black leading-none">{orders.length}</span>
              <span className="text-[9px] text-white/70 font-semibold mt-0.5">{t('boutique.client.heroOrdersShortLabel')}</span>
            </div>
          </div>
        </div>
      </div>

      <BoutiqueStatsStrip stats={stats} />

      {/* ── Tab Navigation ── */}
      <div>
        {/* Mobile tabs: icon + short label, scrollable */}
        <div 
          className="relative flex items-center gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-background/50 p-1.5 backdrop-blur-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:p-2 shadow-sm"
          onMouseLeave={() => setHoveredTab(null)}
        >
          {TAB_KEYS.map(({ key, labelKey, icon: Icon }) => {
            const isActive = tab === key
            const isHovered = hoveredTab === key
            const count = counts[key]
            const label = t(`boutique.client.tabs.${labelKey}`)
            // Short labels for mobile
            const shortLabel = label.length > 8 ? label.slice(0, 7) + '…' : label
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                onMouseEnter={() => setHoveredTab(key)}
                style={{ minHeight: '44px' }}
                className={cn(
                  'group relative z-10 flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer select-none',
                  'sm:flex-1 sm:px-4 sm:py-3 sm:text-sm',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBoutiqueTab"
                    className="absolute inset-0 z-0 rounded-xl bg-card border border-border shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeBoutiqueTabLine"
                    className="absolute bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="hoverBoutiqueTab"
                    className="absolute inset-0 z-0 rounded-xl bg-muted/50 border border-border/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                <Icon className={cn('relative z-10 size-4 shrink-0 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                {/* Full label on sm+, short label on mobile */}
                <span className="relative z-10 hidden sm:block text-[12px] sm:text-sm font-semibold tracking-tight">{label}</span>
                <span className="relative z-10 block sm:hidden text-[11px] font-semibold tracking-tight">{shortLabel}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      'relative z-10 rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums transition-colors duration-300',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                        : 'bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab Content ── */}
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

