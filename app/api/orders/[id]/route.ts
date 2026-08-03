import { NextRequest, NextResponse } from 'next/server'
import { jsonError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'

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
  const allowed = ['payment_status', 'shipping_status', 'price', 'quantity', 'shipping_address']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Ensure total_amount is recalculated if price or quantity changed
  if (updates.price !== undefined || updates.quantity !== undefined) {
    const p = updates.price !== undefined ? parseFloat(updates.price as string) : undefined;
    const q = updates.quantity !== undefined ? parseInt(updates.quantity as string, 10) : undefined;
    if (p !== undefined && q !== undefined) {
      updates.total_amount = p * q;
    } else {
      // Need to fetch current order to calculate
      const { data: currentOrder } = await supabase.from('orders').select('price, quantity').eq('id', id).single();
      const finalP = p !== undefined ? p : (currentOrder?.price || 0);
      const finalQ = q !== undefined ? q : (currentOrder?.quantity || 0);
      updates.total_amount = finalP * finalQ;
    }
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
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
