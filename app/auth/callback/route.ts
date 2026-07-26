import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /auth/callback
 * Supabase auth callback for Google OAuth and email confirmation.
 * This is DIFFERENT from /api/auth/callback which handles Instagram OAuth.
 */
// Only allow same-origin relative paths for post-login redirects. Without
// this, `?next=@evil.com` becomes `https://app.com@evil.com`, which browsers
// resolve to host evil.com (everything before `@` is userinfo) — an open
// redirect straight after authentication.
function safeNextPath(rawNext: string | null): string {
  if (!rawNext) return '/dashboard'
  if (!rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.includes('@')) return '/dashboard'
  return rawNext
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[Supabase Auth Callback] exchangeCodeForSession error:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
