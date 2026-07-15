import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

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

  // Ensure total_amount is recalculated if price or quantity changed
  let total_amount = body.total_amount;
  if (body.price !== undefined || body.quantity !== undefined) {
    const p = body.price !== undefined ? parseFloat(body.price) : undefined;
    const q = body.quantity !== undefined ? parseInt(body.quantity, 10) : undefined;
    if (p !== undefined && q !== undefined) {
      total_amount = p * q;
    } else {
      // Need to fetch current order to calculate
      const { data: currentOrder } = await supabase.from('orders').select('price, quantity').eq('id', id).single();
      const finalP = p !== undefined ? p : (currentOrder?.price || 0);
      const finalQ = q !== undefined ? q : (currentOrder?.quantity || 0);
      total_amount = finalP * finalQ;
    }
    body.total_amount = total_amount;
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Order deleted' })
}
