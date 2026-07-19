import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  listGrantedPermissions,
  listPages,
  subscribeToWebhooks,
} from '@/lib/channels/messenger/oauth'
import { sealAccessToken } from '@/lib/channels/shared/tokens'

/**
 * GET /api/auth/messenger/callback
 * Handles the Facebook Login for Business callback. Unlike Instagram (one
 * account per authorization), a single authorization can return several
 * Pages — each becomes its own channel_accounts row (platform: 'messenger').
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (error) {
    console.error('[Messenger Callback] Error from Meta:', error)
    return NextResponse.redirect(`${appUrl}/accounts?error=access_denied`)
  }
  if (!code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_code`)
  }

  const storedState = request.cookies.get('messenger_oauth_state')?.value
  if (state && storedState && state !== storedState) {
    return NextResponse.redirect(`${appUrl}/accounts?error=invalid_state`)
  }

  try {
    const clientSupabase = await createClient()
    const {
      data: { user },
    } = await clientSupabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=not_authenticated`)
    }

    const shortLivedToken = await exchangeCodeForToken(code)
    const { accessToken: longLivedUserToken } = await exchangeForLongLivedToken(shortLivedToken)
    const pages = await listPages(longLivedUserToken)

    if (pages.length === 0) {
      const granted = await listGrantedPermissions(longLivedUserToken)
      const reason = `Permissions accordées: ${granted}`
      return NextResponse.redirect(`${appUrl}/accounts?error=no_pages&reason=${encodeURIComponent(reason)}`)
    }

    const adminSupabase = createAdminClient()

    let savedCount = 0
    let lastErrorMessage: string | null = null

    for (const page of pages) {
      const { error: upsertError } = await adminSupabase.from('channel_accounts').upsert(
        {
          user_id: user.id,
          platform: 'messenger',
          facebook_user_id: page.id,
          page_id: page.id,
          page_name: page.name,
          page_picture_url: page.picture?.data?.url ?? null,
          access_token: await sealAccessToken(page.access_token),
          token_type: 'page',
          is_active: true,
          connected_at: new Date().toISOString(),
          last_token_refresh: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform,page_id' }
      )

      if (upsertError) {
        console.error('[Messenger Callback] Upsert error for page', page.id, upsertError)
        lastErrorMessage = upsertError.message
        continue
      }

      savedCount += 1
      await subscribeToWebhooks(page.id, page.access_token)
    }

    if (savedCount === 0) {
      const reason = lastErrorMessage ?? 'Unknown error'
      return NextResponse.redirect(`${appUrl}/accounts?error=db_error&reason=${encodeURIComponent(reason)}`)
    }

    const { data: existingSub } = await adminSupabase.from('subscriptions').select('id').eq('user_id', user.id).single()
    if (!existingSub) {
      await adminSupabase.from('subscriptions').insert({ user_id: user.id, status: 'inactive' })
    }

    const response = NextResponse.redirect(`${appUrl}/accounts?connected=messenger`)
    response.cookies.delete('messenger_oauth_state')
    return response
  } catch (err) {
    console.error('[Messenger Callback] Unhandled error:', err)
    return NextResponse.redirect(`${appUrl}/accounts?error=server_error`)
  }
}
