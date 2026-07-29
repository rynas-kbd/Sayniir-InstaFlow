import type { AiTool } from './types'

interface Input {
  productId: string
}

export const deleteProductTool: AiTool<Input, { deleted: boolean }> = {
  name: 'delete_product',
  description: 'Supprime un produit/offre de la Boutique.',
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: { productId: { type: 'string' } },
    required: ['productId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'products', id: input.productId }],
  run: async (input, ctx) => {
    const { error } = await ctx.supabase
      .from('products')
      .delete()
      .eq('id', input.productId)
      .eq('channel_account_id', ctx.channelAccountId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  },
}
