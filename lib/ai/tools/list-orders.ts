import type { AiTool } from './types.ts'

interface Input {
  limit?: number
  shippingStatus?: string
}

interface OrderRow {
  id: string
  customer_name: string
  product_name: string
  quantity: number
  total_amount: number
  payment_status: string
  shipping_status: string
  created_at: string
  items?: Array<{ product_name: string; quantity: number }>
  item_count?: number
}

export const listOrdersTool: AiTool<Input, OrderRow[]> = {
  name: 'list_orders',
  description: 'Liste les commandes récentes de la Boutique (client, produit, montant, statut paiement/livraison).',
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Nombre maximum de commandes (défaut 20, max 100).' },
      shippingStatus: { type: 'string', description: 'Filtre optionnel sur le statut de livraison.' },
    },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)
    let query = ctx.supabase
      .from('orders')
      .select('id, customer_name, product_name, quantity, total_amount, payment_status, shipping_status, created_at, items:order_items(product_name, quantity, position)')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (input.shippingStatus) query = query.eq('shipping_status', input.shippingStatus)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []).map((order: OrderRow) => ({
      ...order,
      item_count: order.items?.length ?? 1,
    }))
  },
}
