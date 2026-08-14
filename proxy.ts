import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_COOKIE, matchLocaleFromAcceptLanguage } from '@/lib/i18n/config'

/**
 * Content-Security-Policy — shipped Report-Only for now (see
 * docs/SECURITY_AUDIT.md). Report-Only never blocks anything; it only logs
 * violations to the browser console, which is exactly what we want before
 * committing to an enforcing policy on a codebase this size. Flip to
 * `Content-Security-Policy` (drop `-Report-Only`) once a normal pass through
 * the app shows no unexpected violations.
 * 
 * Note on Facebook SDK: The FB SDK dynamically loads additional scripts and
 * creates inline scripts. With 'strict-dynamic', those fail to load unless
 * we also add 'unsafe-inline' as a fallback for older browsers (which is
 * ignored by browsers that support 'strict-dynamic', but required here for
 * the SDK's inline scripts). See: https://developers.facebook.com/docs/javascript/quickstart
 */
function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'strict-dynamic' https://connect.facebook.net https://*.facebook.com https://*.facebook.net`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind/CSS-in-JS inline styles — documented tradeoff
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.supabase.co https://graph.instagram.com https://graph.facebook.com https://connect.facebook.net https://*.facebook.com`,
    `frame-src 'self' https://www.facebook.com https://*.facebook.com`, // Pour la popup de connexion WhatsApp Embedded Signup
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ')
}

function withSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy-Report-Only', buildCsp(nonce))
  return response
}

export async function proxy(request: NextRequest) {
  // Generated before the Supabase client so it's present on every response
  // path below, including the early redirects.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce
  )

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = withSecurityHeaders(
            NextResponse.next({ request: { headers: requestHeaders } }),
            nonce
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // First visit ever — no locale cookie yet. Detect from Accept-Language
  // (fallback French) so the very first HTML render already comes back in
  // the right language instead of defaulting to French then flashing.
  // Set AFTER getUser(): the Supabase `setAll` callback above can reassign
  // `supabaseResponse` to a fresh NextResponse when it refreshes the
  // session cookie, which would silently drop anything set on the old one.
  if (!request.cookies.get(LOCALE_COOKIE)) {
    const detected = matchLocaleFromAcceptLanguage(request.headers.get('accept-language'))
    supabaseResponse.cookies.set(LOCALE_COOKIE, detected, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  }

  // Protect /dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withSecurityHeaders(NextResponse.redirect(url), nonce)
  }

  // Protect /admin routes — require role=admin, except /admin/login
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return withSecurityHeaders(NextResponse.redirect(url), nonce)
    }
    // Check admin role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return withSecurityHeaders(NextResponse.redirect(url), nonce)
    }
  }

  // Redirect authenticated admin users away from /admin/login to /admin dashboard
  if (user && request.nextUrl.pathname === '/admin/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return withSecurityHeaders(NextResponse.redirect(url), nonce)
    }
  }

  // Redirect authenticated users away from /login
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return withSecurityHeaders(NextResponse.redirect(url), nonce)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, static assets
     * - /api/webhook/* (Meta webhooks — must NOT be intercepted)
     * - /api/auth/callback (OAuth flow handles its own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
