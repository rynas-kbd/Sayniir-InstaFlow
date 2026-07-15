import { NextResponse } from 'next/server'
import { getLoginUrl } from '@/lib/meta/oauth'

/**
 * GET /api/auth/facebook
 * Redirects the user to Facebook Login with the required permissions.
 * Uses a random `state` param to prevent CSRF attacks.
 */
export async function GET() {
  const state = Math.random().toString(36).substring(2, 15)
  const loginUrl = getLoginUrl(state)

  const response = NextResponse.redirect(loginUrl)

  // Store state in cookie to verify on callback
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return response
}
