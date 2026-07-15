import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['qualifying', 'qualified', 'disqualified'] as const
type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return typeof value === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(value)
}

// PATCH /api/leads/[id] — advance or resolve a lead's qualification status (agency vertical)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (!isAllowedStatus(body.qualification_status)) {
    return NextResponse.json(
      { error: `Invalid qualification_status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // First verify the lead belongs to an account owned by this user
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('channel_account_id')
    .eq('id', id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', lead.channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Unauthorized to edit this lead' }, { status: 403 })

  const { data: updatedLead, error } = await supabase
    .from('leads')
    .update({ qualification_status: body.qualification_status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updatedLead)
}
