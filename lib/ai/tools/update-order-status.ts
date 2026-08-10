import type { AiTool } from './types.ts'

interface Input {
  orderId: string
  paymentStatus?: string
  shippingStatus?: string
}

export const updateOrderStatusTool: AiTool<Input, { updated: boolean }> = {
  name: 'update_order_status',
  description: "Met à jour le statut de paiement et/ou de livraison d'une commande.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      orderId: { type: 'string' },
      paymentStatus: { type: 'string' },
      shippingStatus: { type: 'string' },
    },
    required: ['orderId'],
    additionalProperties: false,
  },
  resourceRefs: (input) => [{ table: 'orders', id: input.orderId }],
  run: async (input, ctx) => {
    const patch: Record<string, string> = {}
    if (input.paymentStatus) patch.payment_status = input.paymentStatus
    if (input.shippingStatus) patch.shipping_status = input.shippingStatus
    if (Object.keys(patch).length === 0) return { updated: false }

    const { data, error } = await ctx.supabase
      .from('orders')
      .update(patch)
      .eq('id', input.orderId)
      .eq('channel_account_id', ctx.channelAccountId)
      .select('id')
    if (error) throw new Error(error.message)
    return { updated: (data?.length ?? 0) > 0 }
  },
}
