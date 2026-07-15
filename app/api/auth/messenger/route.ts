import { NextResponse } from 'next/server'
import { getLoginUrl } from '@/lib/channels/messenger/oauth'

/**
 * GET /api/auth/messenger
 * Redirects the user to Facebook Login for Business with the required
 * Page permissions. Mirrors app/api/auth/facebook/route.ts's CSRF pattern.
 */
export async function GET() {
  const state = Math.random().toString(36).substring(2, 15)
  const loginUrl = getLoginUrl(state)

  const response = NextResponse.redirect(loginUrl)

  response.cookies.set('messenger_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
