'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProductTable } from './product-table'
import { OrderTable } from './order-table'
import { AgentSettingsCard } from './agent-settings-card'
import type { Product, Order, AgentSettings } from './types'

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
  return (
    <Tabs defaultValue="products">
      <TabsList>
        <TabsTrigger value="products">Produits ({products.length})</TabsTrigger>
        <TabsTrigger value="orders">Commandes ({orders.length})</TabsTrigger>
        <TabsTrigger value="ai">Configuration IA</TabsTrigger>
      </TabsList>
      <TabsContent value="products">
        <ProductTable channelAccountId={channelAccountId} initialProducts={products} />
      </TabsContent>
      <TabsContent value="orders">
        <OrderTable initialOrders={orders} />
      </TabsContent>
      <TabsContent value="ai">
        <AgentSettingsCard channelAccountId={channelAccountId} initialSettings={agentSettings} />
      </TabsContent>
    </Tabs>
  )
}
