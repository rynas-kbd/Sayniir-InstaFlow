import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['confirmed', 'cancelled'] as const
type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return typeof value === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(value)
}

// PATCH /api/appointments/[id] — confirm or cancel an appointment (coaching vertical)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (!isAllowedStatus(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // First verify the appointment belongs to an account owned by this user
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('channel_account_id')
    .eq('id', id)
    .single()

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', appointment.channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Unauthorized to edit this appointment' }, { status: 403 })

  const { data: updatedAppointment, error } = await supabase
    .from('appointments')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updatedAppointment)
}
