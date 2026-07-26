import type { AiTool } from './types'

interface Input {
  productId: string
  name?: string
  description?: string
  price?: number
  stockQuantity?: number
  isActive?: boolean
}

export const updateProductTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_product',
  description: 'Modifie un produit existant (nom, description, prix, stock, actif/inactif).',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      stockQuantity: { type: 'number' },
      isActive: { type: 'boolean' },
    },
    required: ['productId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'products', id: input.productId }],
  run: async (input, ctx) => {
    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name.trim().slice(0, 200)
    if (input.description !== undefined) patch.description = input.description.trim() || null
    if (input.price !== undefined) patch.price = input.price
    if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity
    if (input.isActive !== undefined) patch.is_active = input.isActive
    if (Object.keys(patch).length === 0) return { updated: false }

    const { error } = await ctx.supabase
      .from('products')
      .update(patch)
      .eq('id', input.productId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { updated: true }
  },
}
