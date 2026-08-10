import type { AiTool } from './types.ts'

interface Input {
  name: string
  description?: string
  price: number
  kind?: 'physical' | 'service' | 'digital' | 'subscription' | 'event'
  currency?: string
  stockQuantity?: number
}

export const createProductTool: AiTool<Input, { productId: string }> = {
  name: 'create_product',
  description: 'Crée un nouveau produit/offre dans la Boutique (physique, service, digital, abonnement, ou événement).',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      kind: { type: 'string', enum: ['physical', 'service', 'digital', 'subscription', 'event'] },
      currency: { type: 'string' },
      stockQuantity: { type: 'number' },
    },
    required: ['name', 'price'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const { data, error } = await ctx.supabase
      .from('products')
      .insert({
        channel_account_id: ctx.channelAccountId,
        name: input.name.trim().slice(0, 200),
        description: input.description?.trim() || null,
        price: input.price,
        kind: input.kind ?? 'physical',
        currency: input.currency ?? 'DZD',
        stock_quantity: input.stockQuantity ?? 0,
        is_active: true,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Création du produit impossible')
    return { productId: data.id }
  },
}
