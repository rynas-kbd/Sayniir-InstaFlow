import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { computeOrderTotals } from '@/lib/boutique/order-total'
import { buildOrderItemsPayload, hasOrderItemsErrors, validateOrderItems, type EditableOrderItem } from '@/components/boutique/order-items-schema'
import type { Translator } from '@/lib/i18n/translate'

const serverT = Object.assign((key: string) => key, {
  plural: (key: string) => key,
  list: () => [],
}) as Translator

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  // First verify the order belongs to an account owned by this user
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('channel_account_id, discount_percent_off, discount_amount_off')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', order.channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Unauthorized to edit this order' }, { status: 403 })

  // Mass-assignment guard — only these columns are writable from the client.
  // total_amount is deliberately excluded: it is always derived below, never
  // taken from the request body, or a caller could set it directly.
  //
  // Was previously ['status', 'price', 'quantity', 'notes', 'shipping_address',
  // 'contact_id'] — 'status', 'notes' and 'contact_id' don't exist as columns
  // on `orders` (the real status fields are payment_status/shipping_status).
  // This is the route order-table.tsx actually calls (PATCH /api/orders/{id}),
  // so the payment/shipping status dropdowns silently didn't persist.
  const allowed = ['payment_status', 'shipping_status', 'shipping_address']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  let itemPayload: EditableOrderItem[] | null = null
  if (Array.isArray(body.items)) {
    itemPayload = buildOrderItemsPayload(body.items)
    const errors = validateOrderItems(itemPayload, serverT)
    if (hasOrderItemsErrors(errors)) {
      return NextResponse.json({ error: 'Invalid order items', details: errors }, { status: 400 })
    }
    const totals = computeOrderTotals(itemPayload.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price })), {
      percent_off: order.discount_percent_off,
      amount_off: order.discount_amount_off,
    })
    const first = itemPayload[0]
    updates.product_name = first.product_name
    updates.price = first.unit_price
    updates.size = first.size
    updates.color = first.color
    updates.quantity = first.quantity
    updates.currency = first.currency
    updates.total_amount = totals.total
  }

  if (itemPayload) {
    const { error: replaceError } = await supabase.rpc('replace_order_items', { p_order_id: id, p_items: itemPayload })
    if (replaceError) return jsonError(500, 'Une erreur est survenue', replaceError)
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('*, contact:contacts(id, full_name, username), items:order_items(*)')
    .single()

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(updatedOrder)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // First verify the order belongs to an account owned by this user
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('channel_account_id')
    .eq('id', id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', order.channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Unauthorized to delete this order' }, { status: 403 })

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json({ success: true, message: 'Order deleted' })
}
