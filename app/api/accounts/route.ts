import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/accounts
 * Returns all connected Instagram accounts for the authenticated user.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: accounts, error } = await supabase
    .from('channel_accounts')
    .select(
      'id, platform, page_id, page_name, page_picture_url, instagram_username, phone_number, is_active, token_expires_at, connected_at'
    )
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false })

  if (error) {
    console.error('[GET /api/accounts]', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }

  return NextResponse.json({ accounts: accounts ?? [] })
}
