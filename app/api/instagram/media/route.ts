import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAccessToken } from '@/lib/channels/shared/tokens'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
  }

  // Verify the account belongs to this user
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id, access_token')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  try {
    const accessToken = await resolveAccessToken(account.access_token)
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&access_token=${accessToken}`
    )
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error('[API] Failed to fetch media:', data.error)
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch media' }, { status: 500 })
    }

    return NextResponse.json({ data: data.data })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API] Media fetch exception:', err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
