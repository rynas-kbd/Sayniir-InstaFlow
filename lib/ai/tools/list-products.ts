import type { AiTool } from './types.ts'

interface Input {
  activeOnly?: boolean
  limit?: number
}

interface ProductRow {
  id: string
  name: string
  kind: string
  price: number
  currency: string
  stock_quantity: number
  is_active: boolean
}

export const listProductsTool: AiTool<Input, ProductRow[]> = {
  name: 'list_products',
  description: 'Liste les produits/offres de la Boutique (physique, service, digital, abonnement, événement).',
  risk: 'read',
  inputSchema: {
    type: 'object',
    properties: {
      activeOnly: { type: 'boolean', description: 'Ne retourner que les produits actifs (défaut: true).' },
      limit: { type: 'number', description: 'Nombre maximum de produits (défaut 50, max 200).' },
    },
    required: [],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200)
    let query = ctx.supabase
      .from('products')
      .select('id, name, kind, price, currency, stock_quantity, is_active')
      .eq('channel_account_id', ctx.channelAccountId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (input.activeOnly !== false) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
