'use client'

import { useState } from 'react'
import { Package, ShoppingCart, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductTable } from './product-table'
import { OrderTable } from './order-table'
import { AgentSettingsCard } from './agent-settings-card'
import type { Product, Order, AgentSettings } from './types'

const TABS = [
  { key: 'products', label: 'Produits',   icon: Package },
  { key: 'orders',   label: 'Commandes',  icon: ShoppingCart },
  { key: 'ai',       label: 'Config IA',  icon: Bot },
] as const

type TabKey = (typeof TABS)[number]['key']

export function BoutiqueClient({
  channelAccountId,
  products,
  orders,
  agentSettings,
}: {
  channelAccountId: string
  products: Product[]
  orders: Order[]
  agentSettings: AgentSettings
}) {
  const [tab, setTab] = useState<TabKey>('products')

  const counts: Partial<Record<TabKey, number>> = {
    products: products.length,
    orders: orders.length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 py-7 text-white shadow-lg">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-20 size-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="size-4 text-white/80" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Commerce IA</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Boutique</h2>
            <p className="mt-1 text-sm text-white/70">
              {products.length} produit{products.length !== 1 ? 's' : ''} · {orders.length} commande{orders.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Stats pills */}
          <div className="hidden sm:flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Package className="size-4 text-white/80" />
              <span className="text-sm font-semibold">{products.length}</span>
              <span className="text-xs text-white/60">produits</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <ShoppingCart className="size-4 text-white/80" />
              <span className="text-sm font-semibold">{orders.length}</span>
              <span className="text-xs text-white/60">commandes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key
            const count = counts[key]
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-[11px] sm:text-sm">{label}</span>
                {count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
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
        <div className="mt-2">
          {tab === 'products' && (
            <ProductTable channelAccountId={channelAccountId} initialProducts={products} />
          )}
          {tab === 'orders' && (
            <OrderTable initialOrders={orders} />
          )}
          {tab === 'ai' && (
            <AgentSettingsCard channelAccountId={channelAccountId} initialSettings={agentSettings} />
          )}
        </div>
      </div>
    </div>
  )
}
