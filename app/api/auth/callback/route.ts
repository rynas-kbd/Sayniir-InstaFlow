import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getInstagramUserInfo,
  subscribeToWebhooks,
} from '@/lib/meta/oauth'
import { sealAccessToken } from '@/lib/channels/shared/tokens'

/**
 * GET /api/auth/callback
 * Handles the Instagram OAuth callback after the user authorizes the app.
 * Lient le compte Instagram Business à l'utilisateur déjà connecté.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] Error from Meta:', error)
    return NextResponse.redirect(`${appUrl}/accounts?error=access_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_code`)
  }

  // CSRF: Validate state
  const storedState = request.cookies.get('oauth_state')?.value
  if (state && storedState && state !== storedState) {
    return NextResponse.redirect(`${appUrl}/accounts?error=invalid_state`)
  }

  try {
    // Retrieve the currently logged-in user
    const clientSupabase = await createClient()
    const { data: { user } } = await clientSupabase.auth.getUser()

    if (!user) {
      console.error('[OAuth Callback] No authenticated user found')
      return NextResponse.redirect(`${appUrl}/login?error=not_authenticated`)
    }

    const supabaseUserId = user.id

    // Step 1: Exchange code for short-lived Instagram token
    const shortLivedToken = await exchangeCodeForToken(code)

    // Step 2: Upgrade to long-lived token (~60 days)
    const { accessToken: longLivedToken, expiresIn } =
      await exchangeForLongLivedToken(shortLivedToken)

    const tokenExpiresAt = new Date()
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn)

    // Step 3: Get Instagram user info
    const igUser = await getInstagramUserInfo(longLivedToken)
    const igPageId = igUser.user_id ?? igUser.id
    console.log('[OAuth Callback] Instagram user linked:', { id: igUser.id, user_id: igUser.user_id, igPageId, username: igUser.username, forUser: supabaseUserId })

    const adminSupabase = createAdminClient()

    // Step 4: Upsert the channel account in DB linked to user
    const { error: upsertError } = await adminSupabase
      .from('channel_accounts')
      .upsert(
        {
          user_id: supabaseUserId,
          platform: 'instagram',
          facebook_user_id: igUser.id,
          page_id: igPageId,
          page_name: igUser.name,
          page_picture_url: igUser.profile_picture_url ?? null,
          instagram_business_id: igPageId,
          instagram_username: igUser.username,
          access_token: await sealAccessToken(longLivedToken),
          token_type: 'long_lived',
          token_expires_at: tokenExpiresAt.toISOString(),
          is_active: true,
          connected_at: new Date().toISOString(),
          last_token_refresh: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform,page_id' }
      )

    if (upsertError) {
      console.error('[OAuth Callback] Upsert error:', upsertError)
      return NextResponse.redirect(`${appUrl}/accounts?error=db_error&reason=${encodeURIComponent(upsertError.message)}`)
    }

    // Step 5: Get the channel_account ID for subscription linking
    const { data: igAccount } = await adminSupabase
      .from('channel_accounts')
      .select('id')
      .eq('user_id', supabaseUserId)
      .eq('page_id', igPageId)
      .single()

    // Create a default inactive subscription if none exists yet for this user
    if (igAccount) {
      const { data: existingSub } = await adminSupabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', supabaseUserId)
        .single()

      if (!existingSub) {
        await adminSupabase.from('subscriptions').insert({
          user_id: supabaseUserId,
          channel_account_id: igAccount.id,
          status: 'inactive',
        })
        console.log(`[OAuth Callback] 📋 Default subscription created for user ${supabaseUserId}`)
      }
    }

    // Step 6: Subscribe to Meta webhooks using the global Instagram ID
    await subscribeToWebhooks(igPageId, longLivedToken)

    const response = NextResponse.redirect(`${appUrl}/accounts?connected=instagram`)
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('[OAuth Callback] Unhandled error:', err)
    return NextResponse.redirect(`${appUrl}/accounts?error=server_error`)
  }
}
