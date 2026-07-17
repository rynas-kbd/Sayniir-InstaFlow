import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

// GET /api/contacts/export?accountId=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', accountId).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, contact_tags(tags(name))')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })

  const header = ['full_name', 'username', 'phone', 'email', 'tags', 'custom_fields', 'last_inbound_at']
  const lines = [header.join(',')]

  for (const c of contacts ?? []) {
    const tagNames = (c.contact_tags ?? []).map((ct: { tags: { name: string } }) => ct.tags?.name).filter(Boolean).join('; ')
    const row = [
      c.full_name ?? '',
      c.username ?? '',
      c.phone ?? '',
      c.email ?? '',
      tagNames,
      JSON.stringify(c.custom_fields ?? {}),
      c.last_inbound_at ?? '',
    ]
    lines.push(row.map((v) => csvEscape(String(v))).join(','))
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contacts-${accountId}.csv"`,
    },
  })
}
